# "Fiks Ferdig" Todo Application - Programming Plan

## 1. Core Website Components

### Frontend Components

-   **EJS templates** for all pages:
    -   Landing page (/)
    -   todo list view (/)
    -   Login page (/sign-in)
    -   Signup page (/sign-up)
    -   Veiledning page (/veiledning) - for authorized users only

## 2. Required Website Functionality

### Core Features

-   User registration system
-   User login/logout
-   Creating todo items with dates/times
-   Displaying todos in a weekly schedule format
-   Navigation between days (prev/next buttons or tab layout)
-   **Deleting todo items** (exam focus)
-   Task repetition functionality (for recurring tasks)
-   Authorization checks for todo operations

### Extra Features

-   Calendar with color coding for days with todos
-   Todo sharing with family members

## 3. Database Models

### User Model

```javascript
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        password: {
            type: String,
            required: true,
        },
        isAdmin: {
            type: Boolean,
            default: false,
        },
        family: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Family",
        },
    },
    { timestamps: true },
);

const User = mongoose.model("User", userSchema);
module.exports = User;
```

### Todo Model

```javascript
const mongoose = require("mongoose");

const todoSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        completed: {
            type: Boolean,
            default: false,
        },
        completedAt: {
            type: Date,
        },
        day: {
            type: Number,
            min: 1,
            max: 7,
        },
        repeats: {
            type: Boolean,
            default: false,
        },
        repeatPattern: {
            type: String,
            enum: ["daily", "weekly", "none"],
            default: "none",
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        familyAccess: {
            type: Boolean,
            default: false,
        },
        accessLevel: {
            type: String,
            enum: ["private", "view", "edit"],
            default: "private",
        },
    },
    {
        timestamps: true,
    },
);

const Todo = mongoose.model("Todo", todoSchema);
module.exports = Todo;
```

### Family model

```javascript
const mongoose = require("mongoose");

const familySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        admin: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        members: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
    },
    { timestamps: true },
);

const Family = mongoose.model("Family", familySchema);
module.exports = Family;
```

## 4. Project Structure

```md
project-root/
├── public/ # Static assets
│ ├── css/ # Stylesheets
│ ├── js/ # Client-side scripts
│ └── images/ # Images
├── views/ # EJS templates
│ ├── partials/ # Reusable components
├── models/ # Database models
├── routes/ # Route handlers
├── middleware/ # Custom middleware
├── config/ # Configuration
├── utils/ # Utility functions
├── controllers/ # Controllers
├── server.js # Entry point
└── package.json # Dependencies
```

## 5. Dependencies

```md
express
mongoose
express-session
connect-mongo
argon2
ejs
dotenv

validator
cors
```
