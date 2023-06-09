const { nanoid } = require('nanoid');
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const FormData = require('form-data');
const Path = require('path');
const fs = require('fs');
require('dotenv').config();

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
    password: process.env.DB_PASS
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
              });
              response.code(400);
              return response;
        }

        // cek email di db
        const checkEmailQuery = 'SELECT * FROM table_user WHERE user_email = ?';
        const existingUser = await new Promise((resolve, reject) => {
            connection.query(checkEmailQuery, [email], (err, rows, field) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows[0]);
                }
            });
        });

        if (existingUser) {
            const response = h.response({
                status: 'fail',
                message: 'Email already exists',
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
                message: 'Account invalid',
            });
            response.code(400);
            return response;
        }
        
        const token = jwt.sign({ userId : user.user_id }, 'secret_key');
    
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
    try {
        const token = request.headers.authorization.replace('Bearer ', '');
        let decodedToken;

        try{
            decodedToken = jwt.verify(token, 'secret_key');
        } catch (err) {
            const response = h.response({
                status: 'missed',
                message: 'User is not authorized!',
            });
            response.code(401);
            return response;
        }

        const userId = decodedToken.userId;

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

        const { user_pass, ...userData } = user;

        const response = h.response({
            status: 'success',
            message: 'read successful',
            data: userData,
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
    let decodedToken;

    try{
        decodedToken = jwt.verify(token, 'secret_key');
    } catch (err) {
        const response = h.response({
            status: 'missed',
            message: 'User is not authorized!',
        });
        response.code(401);
        return response;
    }

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

const deleteUser = async (request, h) => {
    try {
        const token = request.headers.authorization.replace('Bearer ', '');
        let decodedToken;

        try{
            decodedToken = jwt.verify(token, 'secret_key');
        } catch (err) {
            const response = h.response({
                status: 'missed',
                message: 'User is not authorized!',
            });
            response.code(401);
            return response;
        }

        const userId = decodedToken.userId;

        const query = 'DELETE FROM table_user WHERE user_id = ?';
        
        await new Promise((resolve, reject) => {
            connection.query(query, [userId], (err, rows, field) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });

        const deleteCheck = 'SELECT user_id FROM table_user WHERE user_id = ?';

        const user = await new Promise((resolve, reject) => {
            connection.query(query, [userId], (err, rows, field) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows[0]);
                }
            });
        });

        if (!user) {
            const response = h.response({
                status: 'success',
                message: 'delete successful',
            });
            response.code(200);
            return response;
        } else {
            const response = h.response({
                status: 'fail',
                message: 'User is not found or unauthorized!',
            });
            response.code(401);
            return response;
        }
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
        let decodedToken;

        try{
            decodedToken = jwt.verify(token, 'secret_key');
        } catch (err) {
            const response = h.response({
                status: 'missed',
                message: 'User is not authorized!',
            });
            response.code(401);
            return response;
        }

        const userId = decodedToken.userId;

        // cek plan di db
        const checkPlanQuery = 'SELECT * FROM table_plan WHERE user_id = ?';
        const existingPlan = await new Promise((resolve, reject) => {
            connection.query(checkPlanQuery, [userId], (err, rows, field) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows[0]);
                }
            });
        });

        if (existingPlan) {
            const response = h.response({
                status: 'fail',
                message: 'Plan already exists',
            });
            response.code(400);
            return response;
        }

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
    let decodedToken;

    try{
        decodedToken = jwt.verify(token, 'secret_key');
    } catch (err) {
        const response = h.response({
            status: 'missed',
            message: 'User is not authorized!',
        });
        response.code(401);
        return response;
    }

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
        let decodedToken;

        try{
            decodedToken = jwt.verify(token, 'secret_key');
        } catch (err) {
            const response = h.response({
                status: 'missed',
                message: 'User is not authorized!',
            });
            response.code(401);
            return response;
        }

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
        let decodedToken;

        try{
            decodedToken = jwt.verify(token, 'secret_key');
        } catch (err) {
            const response = h.response({
                status: 'missed',
                message: 'User is not authorized!',
            });
            response.code(401);
            return response;
        }

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

    try {

        const token = request.headers.authorization.replace('Bearer ', '');
        let decodedToken;

        try{
            decodedToken = jwt.verify(token, 'secret_key');
        } catch (err) {
            const response = h.response({
                status: 'missed',
                message: 'User is not authorized!',
            });
            response.code(401);
            return response;
        }

        const userId = decodedToken.userId;

        const query = 'SELECT table_object.object_id AS id, table_food.image_url AS imageUrl, table_food.food_name AS foodName, table_food.food_calories AS foodCal FROM table_object INNER JOIN table_food ON table_object.food_id=table_food.food_id WHERE table_object.user_id = ?';

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
    try {

        const token = request.headers.authorization.replace('Bearer ', '');
        let decodedToken;

        try{
            decodedToken = jwt.verify(token, 'secret_key');
        } catch (err) {
            const response = h.response({
                status: 'missed',
                message: 'User is not authorized!',
            });
            response.code(401);
            return response;
        }

        const userId = decodedToken.userId;
        const file = request.payload.file;
        
        const getPlanIdQuery = 'SELECT plan_id FROM table_plan WHERE user_id = ?'

        const planId = await new Promise((resolve, reject) => {
            connection.query(getPlanIdQuery, [userId], (err, rows, field) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows[0]);
                }
            });
        });
        
        if (!planId) {
            const response = h.response({
                status: 'fail',
                message: 'Plan id not found',
            });
            response.code(404);
            return response;
        }

        const planIdResult = planId.plan_id;
        
        // Save the file to a temp location
        const filePath = Path.join(__dirname, 'uploadTemp', file.hapi.filename);
        const writableStream = fs.createWriteStream(filePath);
        file.pipe(writableStream);

        // Wait to be saved
        await new Promise((resolve, reject) => {
            writableStream.on('finish', resolve);
            writableStream.on('error', reject);
        });
        
        const formData = new FormData();
        formData.append('file', fs.createReadStream(filePath));
        
        const mlResponse = await axios.post('https://healthy-eats-model-p3iarqd74q-uc.a.run.app/predict', formData, {
            headers: formData.getHeaders,
            //responseType: 'arraybuffer',
            responseType: 'json',  
        });

        fs.unlinkSync(filePath);
        
        const predictedClass = mlResponse.data.predicted_class;
        const predictedProb = mlResponse.data.prediction_prob;
        
        let foodName;

        if (predictedClass.includes("_")) {
            foodName = predictedClass.replace(/_/g, " "); 
        } else {
            foodName = predictedClass;
        }

        const getFoodQuery = 'SELECT food_id, food_name, food_calories, image_url FROM table_food WHERE food_name = ?';

        const food = await new Promise((resolve, reject) => {
            connection.query(getFoodQuery, [foodName], (err, rows, field) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows[0]);
                }
            });
        });

        

        const updateConsumeCalQuery = 'UPDATE table_plan SET calories_consume = calories_consume + ? WHERE plan_id = ?';

        await new Promise((resolve, reject) => {
            connection.query(updateConsumeCalQuery, [food.food_calories, planId], (err, rows, field) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });

        const currentDate = new Date();
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, "0");
        const day = String(currentDate.getDate()).padStart(2, "0");
        const formattedDate = `${year}-${month}-${day}`;

        console.log(formattedDate);
        
        const insertObjQuery = 'INSERT INTO table_object (date_captured, user_id, food_id, plan_id) VALUES(?, ?, ?, ?)';

        await new Promise((resolve, reject) => {
            connection.query(insertObjQuery, [formattedDate, userId, food.food_id, planId], (err, rows, field) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });

        const response = h.response({
            status: 'success',
            message: 'image predicted',
            foodName: food.food_name,
            foodCal: food.food_calories,
            foodImg: food.image_url,
            predictedProb: predictedProb,
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
/*
const addConsumedCalorie = async (request, h) => {
    try {
        const { plan_id } = request.params;
        const {
            calories_consume
        } = request.payload;

        try{
            const token = request.headers.authorization.replace('Bearer ', '');
            const decodedToken = jwt.verify(token, 'secret_key');
        } catch (err) {
            const response = h.response({
                status: 'missed',
                message: 'User is not authorized!',
            });
            response.code(401);
            return response;
        }

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
*/

module.exports = {
    createUser,
    loginUser,
    readUser,
    updateUser,
    createPlan,
    readPlan,
    updatePlan,
    deleteUser,
    deletePlan,
    getHistory,
    classifyingImage,
    //addConsumedCalorie,
};
