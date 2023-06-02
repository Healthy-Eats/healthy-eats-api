const { 
    createUser, 
    loginUser, 
    updateUser, 
    createPlan, 
    updatePlan, 
    deletePlan, 
    classifyingImage, 
    addConsumedCalorie, 
    readUser, 
    readPlan, 
    getHistory 
} = require('./handler');

const routes = [
    {
        method: 'POST',
        path: '/register',
        handler: createUser,
    },
    {
        method: 'POST',
        path: '/login',
        handler: loginUser,
    },
    {
        method: 'POST',
        path: '/readUser',
        handler: readUser,
    },
    {
        method: 'PUT',
        path: '/updateUser',
        handler: updateUser
    },
    {
        method: 'POST',
        path: '/createPlan',
        handler: createPlan,
    },
    {
        method: 'POST',
        path: '/{plan_id}',
        handler: readPlan,
    },
    {
        method: 'PUT',
        path: '/{plan_id}/updatePlan',
        handler: updatePlan,
    },
    {
        method: 'DELETE',
        path: '/{plan_id}/deletePlan',
        handler: deletePlan,
    },
    {
        method: 'GET',
        path: '/getHistory',
        handler: getHistory,
    },
    {
        method: 'POST',
        path: '/classifyImage',
        handler: classifyingImage,
        options: {
            payload: {
              output: 'stream',
              parse: true,
              allow: 'multipart/form-data',
              multipart: true,
              maxBytes: 10 * 1024 * 1024,
            },
        },
    },

    // plan c route
    {
        method: 'PUT',
        path: '/updatePlan/{plan_id}/calorie',
        handler: addConsumedCalorie,
    },
];

module.exports = routes;