
# CodeFusion: Online HTML, CSS, and JS IDE

**CodeFusion** is an interactive online Integrated Development Environment (IDE) where users can write and execute HTML, CSS, and JavaScript code in real-time. The app features a split-screen layout: one side for coding and the other for viewing live output. Users can save their code online, download code as zip, making it accessible anytime, and switch between dark and light themes for a personalized experience.

## 🛠️ Technologies Used

- **Frontend**:
  - HTML, CSS (Tailwind CSS)
  - JavaScript (React.js)
  - Redux toolkit
  
- **Backend**:
  - Node.js, Express.js
  
- **Database**:
  - PostgreSQL, Sequelize ORM

- **Authentication**:
  - JWT (JSON Web Tokens)

- **Validation**
  - Yup (frontend)
  - Joi (backend)

## 💡 Features

- **Write Code**: 
  - Users can write HTML, CSS, and JavaScript code in a real-time editor on one side of the screen.
  
- **Live Preview**: 
  - The other half of the screen displays the output of the code written on the left side. This allows users to instantly see how their code performs.

- **Dark & Light Theme**: 
  - Easily switch between dark and light themes for a better coding experience depending on user preference.

- **Save Code Online**: 
  - Users can save their code to the database and access it later from any device by logging in.
 
- **Download Code as ZIP**: 
  - Users can download their code as zip, zip will include .html, .css, .js code files.
  
- **Authentication**: 
  - Login and registration system using JWT tokens for secure user authentication.

- **Search (debouncing)**: 
  - Users can search for code by entering titile of code, debouncing method is used for optimized search

## Getting Started

### Prerequisites

- Node.js and npm
- A PostgreSQL database. You can use your Neon database; its connection URL should include `sslmode=require`.

### Configure the environment

1. In `backend`, copy `.env.example` to `.env` and fill in your Neon `DATABASE_URL` and a strong `SECRET_KEY`. For local development, keep `NODE_ENV=development`, `PORT=3000`, and `CORS_ORIGIN=http://localhost:5173`.
2. In `frontend`, create `.env` with `VITE_BACKEND_URL=http://localhost:3000`.
3. Environment files contain credentials and are ignored by git. Do not commit them. If you use your deployed Neon database locally, local changes will affect that same database; use a separate Neon branch/database for development when possible.

### Install and run

Install dependencies once in each project:

```powershell
cd backend
npm install
cd ..\frontend
npm install
```

Open two terminals from the project directory:

```powershell
cd backend
npm run dev
```

```powershell
cd frontend
npm run dev
```

Open the Vite URL shown in the frontend terminal (normally `http://localhost:5173`). The API runs at `http://localhost:3000`. Restart the frontend after changing its `.env` file.

## 🔐 Authentication

- Users can **sign up** and **log in** using their username and password. A JWT token is generated upon successful login for secure authentication.
- The token is stored in the browser’s local storage and used to make authenticated requests.

## 💬 Contributing

We welcome contributions to CodeFusion! If you'd like to contribute, please fork the repository, create a new branch, and submit a pull request. We ask that you ensure any changes follow the project's coding conventions and include appropriate tests if applicable.

## 🐛 Bugs and Issues

If you encounter any bugs or have suggestions for improvements, please feel free to open an issue on the GitHub repository.


## 👨‍💻 Authors

- [Ketan Singh](https://github.com/ketan1rajput)
  
## 🎉 Acknowledgements

Special thanks to the following resources and libraries:
- [React.js](https://reactjs.org/)
- [Node.js](https://nodejs.org/)
- [Express.js](https://expressjs.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Sequelize ORM](https://sequelize.org/)

## Documentation

- [Architecture Guide](docs/ARCHITECTURE.md)
- [Project Guide](docs/PROJECT_GUIDE.md)
