class AppError extends Error {
    constructor() {
        super();
    }
    create(message, statusCode, statusText) {
        this.message = message;
        this.statusCode = statusCode;
        this.statusText = statusText;
    }
}

export const appError = new AppError();
