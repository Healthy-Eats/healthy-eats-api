const { nanoid } = require('nanoid');
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const FormData = require('form-data');

const connection = mysql.createConnection({
    
    host: '34.101.128.76',
    user: 'root',
    database: 'db-healthy-eats',
    password: 'eatshealthy'

});

const createUser = async (request, h) => {
    try {
        const {
            name,
            email,
            pass
        } = request.payload;
    
        if (!email || !pass) {
            const response = h.response({
                status: 'fail',
                message: 'Please fill email and password',
                data: email,
              });
              response.code(400);
              return response;
        }
    
        const hashedPass = await bcrypt.hash(pass, 10);
    
        const query = "INSERT INTO table_user(user_name, user_email, user_pass) VALUES(?, ?, ?)";
    
        await new Promise((resolve, reject) => {
            connection.query(query, [name, email, hashedPass], (err, rows, field) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    
        const response = h.response({
            status: 'success',
            message: 'User created successfully',
        });
        response.code(200);
        return response;
    } catch (err) {
        const response = h.response({
          status: 'fail',
          message: err.message,
        });
        response.code(500);
        return response;
    }
}

const loginUser = async (request, h) => {
    const { email, pass } = request.payload;

    try {
        const query = "SELECT * FROM table_user WHERE user_email = ?";

        const user = await new Promise((resolve, reject) => {
            connection.query(query, [email], (err, rows, field) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows[0]);
                }
            });
        });
        
        if (!user){
            const response = h.response({
                status: 'fail',
                message: 'Account invalid',
            });
            response.code(400);
            return response;
        }
        
        const isPassValid = await bcrypt.compare(pass, user.user_pass);
        
        if (!isPassValid){
            const response = h.response({
                status: 'fail',
                message: 'Account invalid!',
            });
            response.code(400);
            return response;
        }
        
        const token = jwt.sign({ userId : user.user_id }, 'secret_key');
        
        // check & extract userid
        // const decodedToken = jwt.verify(token, 'secret_key');
        // const userId = decodedToken.userId;
    
        const response = h.response({
            status: 'success',
            message: 'login successful',
            data: { token },
        });
        response.code(200);
        return response;
    } catch (err) {
        const response = h.response({
            status: 'fail',
            message: err.message,
        });
        response.code(500);
        return response;
    }
}

const readUser = async (request, h) => {

    const token = request.headers.authorization.replace('Bearer ', '');
    const decodedToken = jwt.verify(token, 'secret_key');
    const userId = decodedToken.userId;

    try {
        const query = 'SELECT * FROM table_user WHERE user_id = ?';
        
        const user = await new Promise((resolve, reject) => {
            connection.query(query, [userId], (err, rows, field) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows[0]);
                }
            });
        });

        if (!user){
            const response = h.response({
                status: 'fail',
                message: 'User is not found!',
            });
            response.code(400);
            return response;
        }

        const response = h.response({
            status: 'success',
            message: 'read successful',
            data: user
        });
        response.code(200);
        return response;
    } catch (err) {
        const response = h.response({
            status: 'fail',
            message: err.message,
        });
        response.code(500);
        return response;
    }
}

const updateUser = async (request, h) => {
    const { 
        name,
        age,
        gender,
        height,
        weight
    } = request.payload;

    const token = request.headers.authorization.replace('Bearer ', '');
    const decodedToken = jwt.verify(token, 'secret_key');
    const userId = decodedToken.userId;

    try {
        const query = 'UPDATE table_user SET user_name = ?, user_age = ?, user_gender = ?, user_height = ?, user_weight = ? WHERE user_id = ?';
        
        // will add userId later
        await new Promise((resolve, reject) => {
            connection.query(query, [name, age, gender, height, weight, userId], (err, rows, field) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });

        const response = h.response({
            status: 'success',
            message: 'update successful',
        });
        response.code(200);
        return response;
    } catch (err) {
        const response = h.response({
            status: 'fail',
            message: err.message,
        });
        response.code(500);
        return response;
    }
}

const createPlan = async (request, h) => {
    try {
        const {
            name,
            goal,
            activity,
            calories_target,
        } = request.payload;

        const token = request.headers.authorization.replace('Bearer ', '');
        const decodedToken = jwt.verify(token, 'secret_key');
        const userId = decodedToken.userId;

        const query = 'INSERT INTO table_plan (user_id, plan_name, plan_goal, plan_activity, calories_target) VALUES (?, ?, ?, ?, ?)';

        await new Promise((resolve, reject) => {
            connection.query(query, [userId, name, goal, activity, calories_target], (err, rows, field) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });

        const response = h.response({
            status: 'success',
            message: 'Plan created successfully',
        });
        response.code(201);
        return response;
    } catch (err) {
        const response = h.response({
            status: 'fail',
            message: err.message,
        });
        response.code(500);
        return response;
    }
};

const readPlan = async (request, h) => {

    const token = request.headers.authorization.replace('Bearer ', '');
    const decodedToken = jwt.verify(token, 'secret_key');
    const userId = decodedToken.userId;

    try {
        const query = 'SELECT * FROM table_plan WHERE user_id = ?';
        
        const plan = await new Promise((resolve, reject) => {
            connection.query(query, [userId], (err, rows, field) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows[0]);
                }
            });
        });

        if (!plan){
            const response = h.response({
                status: 'fail',
                message: 'Plan is not found!',
            });
            response.code(400);
            return response;
        }

        const response = h.response({
            status: 'success',
            message: 'read successful',
            data: { plan }
        });
        response.code(200);
        return response;
    } catch (err) {
        const response = h.response({
            status: 'fail',
            message: err.message,
        });
        response.code(500);
        return response;
    }
}

const updatePlan = async (request, h) => {
    try {
        const { plan_id } = request.params;
        const {
            name,
            goal,
            activity,
            calories_target,
            calories_consume
        } = request.payload;

        const token = request.headers.authorization.replace('Bearer ', '');
        const decodedToken = jwt.verify(token, 'secret_key');
        const userId = decodedToken.userId;

        const query = 'UPDATE table_plan SET plan_name = ?, plan_goal = ?, plan_activity = ?, calories_target = ?, calories_consume = ? WHERE plan_id = ?';

        await new Promise((resolve, reject) => {
            connection.query(query, [name, goal, activity, calories_target, calories_consume, plan_id], (err, rows, field) => {
                if (err) {
                    reject(err);
                } else {
                    if (rows.affectedRows === 0) {
                        reject(new Error('Plan not found or unauthorized'));
                    } else {
                        resolve();
                    }
                }
            });
        });

        const response = h.response({
            status: 'success',
            message: 'Plan updated successfully',
        });
        response.code(200);
        return response;
    } catch (err) {
        const response = h.response({
            status: 'fail',
            message: err.message,
        });
        response.code(500);
        return response;
    }
};

const deletePlan = async (request, h) => {
    try {
        const { plan_id } = request.params;

        const token = request.headers.authorization.replace('Bearer ', '');
        const decodedToken = jwt.verify(token, 'secret_key');
        const userId = decodedToken.userId;

        const query = 'DELETE FROM table_plan WHERE plan_id = ? AND user_id = ?';

        await new Promise((resolve, reject) => {
            connection.query(query, [plan_id, userId], (err, rows, field) => {
                if (err) {
                    reject(err);
                } else {
                    if (rows.affectedRows === 0) {
                        reject(new Error('Plan not found or unauthorized'));
                    } else {
                        resolve();
                    }
                }
            });
        });

        const response = h.response({
            status: 'success',
            message: 'Plan deleted successfully',
        });
        response.code(200);
        return response;
    } catch (err) {
        const response = h.response({
            status: 'fail',
            message: err.message,
        });
        response.code(500);
        return response;
    }
};


// not tested yet
const getHistory = async (request, h) => {

    const token = request.headers.authorization.replace('Bearer ', '');
    const decodedToken = jwt.verify(token, 'secret_key');
    const userId = decodedToken.userId;

    try {

        const query = 'SELECT table_object.object_id AS id, table_object.image_url AS imageUrl, table_food.food_name AS foodName, table_food.food_calories AS foodCal FROM table_object INNER JOIN table_food ON table_object.food_id=table_food.food_id WHERE table_object.user_id = ?';

        const listObj = await new Promise((resolve, reject) => {
            connection.query(query, [userId], (err, rows, field) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });

        const response = h.response({
            status: 'success',
            message: 'History read successfully',
            data: listObj,
        });
        response.code(200);
        return response;
    } catch (err) {
        const response = h.response({
            status: 'fail',
            message: err.message,
        });
        response.code(500);
        return response;
    }
};

// for ML endpoints (also could be used to update the calories (unsure))
// not finished yet
const classifyingImage = async (request, h) => {
    
    const token = request.headers.authorization.replace('Bearer ', '');
    const decodedToken = jwt.verify(token, 'secret_key');
    const userId = decodedToken.userId;
    
    try {

        const { file } = request.payload;

        const fd = new FormData();

        fd.append('file', file._data);

        const headers = fd.getHeaders();

        const mlResult = await axios.post('http://', fd, { // ML endpoint
            headers,
        });

        const result = mlResult.data;

        /* insert the process code here

        const currentDate = new Date().toISOString();

        const query = 'INSERT INTO table_object(user_id, plan_id, food_id, date_captured, imageUrl) VALUES(?, ?, ?, ?, ?)'

        end here */ 
        
        const response = h.response({
            status: 'success',
            message: 'Uploaded and processed successfully',
            data: result,
        });
        response.code(200);
        return response;
    } catch (err) {
        const response = h.response({
            status: 'fail',
            message: err.message,
        });
        response.code(500);
        return response;
    }
};

// plan c handler

const addConsumedCalorie = async (request, h) => {
    try {
        const { plan_id } = request.params;
        const {
            calories_consume
        } = request.payload;

        const token = request.headers.authorization.replace('Bearer ', '');
        const decodedToken = jwt.verify(token, 'secret_key');
        const userId = decodedToken.userId;

        const query = 'UPDATE table_plan SET calories_consume = calories_consume + ? WHERE plan_id = ?';

        await new Promise((resolve, reject) => {
            connection.query(query, [calories_consume, plan_id], (err, rows, field) => {
                if (err) {
                    reject(err);
                } else {
                    if (rows.affectedRows === 0) {
                        reject(new Error('Plan not found or unauthorized'));
                    } else {
                        resolve();
                    }
                }
            });
        });

        const response = h.response({
            status: 'success',
            message: 'Calories updated successfully',
        });
        response.code(200);
        return response;
    } catch (err) {
        const response = h.response({
            status: 'fail',
            message: err.message,
        });
        response.code(500);
        return response;
    }
};

module.exports = {
    createUser,
    loginUser,
    readUser,
    updateUser,
    createPlan,
    readPlan,
    updatePlan,
    deletePlan,
    getHistory,
    classifyingImage,
    addConsumedCalorie,
};