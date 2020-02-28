const axios = require('axios');
const url = 'https://jsonplaceholder.typicode.com/posts';

const mysql = require('mysql');
const insert = 'INSERT INTO post SET ?';

const db = mysql.createConnection({
    host: process.env.RDS_HOST,
    port: process.env.RDS_PORT,
    database: process.env.RDS_DATABASE,
    user: process.env.RDS_USER,
    password: process.env.RDS_PASSWORD
});

const retrievePosts = async () => {
    const apiResponse = await axios({ method: 'get', url: url });
    return apiResponse.data;
};

const storePost = async (post, stats) => {
    db.query(insert, post, function (error, results, fields) {
        if (error) {
            console.log(error.message);
            throw error;
        }
        if (! error) {
            stats.postsWritten ++;
        }
    });
};

/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Context doc: https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html
 * @param {Object} context
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 *
 */
exports.lambdaHandler = async (event, context) => {
    try {
        const stats = {
            postsRead: 0,
            postsWritten: 0
        };
        const response = {
            statusCode: 200,
            body: null
        };

        const posts = await retrievePosts();
        stats.postsRead += posts.length;
        for (let i = 0; i < posts.length; i ++) {
            await storePost(posts[i], stats);
        }

        if (response.statusCode === 200) {
            response.body = JSON.stringify({
                message: `${stats.postsRead} posts read and ${stats.postsWritten} posts written.`
            });
        }
        return response;
    } catch (err) {
        return {
            'statusCode': 500,
            'body': err
        };
    }
};
