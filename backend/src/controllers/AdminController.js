const User = require("../../models/User");
const FrontendQuestion = require("../../models/FrontendQuestion");

const showUsers = async (req, res) => {
    try {
        const Users = await User.findAll();
        res.json(Users);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
}

const getQuestions = async (req, res) => {
    try {
    const questions = await FrontendQuestion.findAll();
    res.json(questions)
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }   
}

const postQuestion = async (req, res) => {
    try {
        const { title, description, difficulty, starter_code, test_cases } = req.body;
        const question = await FrontendQuestion.create({
            title,
            description,
            difficulty,
            starter_code,
            test_cases
        });
        res.status(201).json({ message: "Question created successfully", data: question });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
}

function deleteQuestion() {
    return "delete question";
}

function deleteUser() {
    return "delete user";
}

function updateQuestion() {
    return "update question";
}

module.exports = {
    showUsers,
    getQuestions,
    postQuestion,
    deleteQuestion,
    deleteUser,
    updateQuestion,
};
