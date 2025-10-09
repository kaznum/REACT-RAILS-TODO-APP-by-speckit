# React Rails Todo App - Frontend

This is the frontend application for the React Rails Todo App, built with React 18+ and Create React App.

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in development mode.
Open [http://localhost:3001](http://localhost:3001) to view it in your browser.

The page will reload when you make changes.

### `npm test`

Launches the test runner in interactive watch mode.

### `npm run build`

Builds the app for production to the `build` folder.
It correctly bundles React in production mode and optimizes the build for the best performance.

### `npm run lint`

Runs ESLint to check for code quality issues.

### `npm run lint:fix`

Runs ESLint and automatically fixes issues where possible.

### `npm run format`

Formats code using Prettier.

## Environment Variables

Copy `.env.example` to `.env.local` and configure:

- `REACT_APP_API_URL` - Backend API URL (default: http://localhost:3000/api/v1)
- `REACT_APP_FRONTEND_URL` - Frontend URL for OAuth redirects (default: http://localhost:3001)
- `REACT_APP_ENABLE_DEBUG_MODE` - Enable debug mode (default: true)

## Tech Stack

- React 18.2
- React Router DOM v6
- Axios for API calls
- React Testing Library
- ESLint + Prettier
- Create React App

## Learn More

- [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started)
- [React documentation](https://reactjs.org/)
