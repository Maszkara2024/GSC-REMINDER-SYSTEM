const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const { setGlobalOptions } = require("firebase-functions");

admin.initializeApp();
setGlobalOptions({ maxInstances: 10 });

// Your new function
exports.remindAllStudents = onRequest(async (req, res) => {
    const message = {
        notification: {
            title: "Teacher Reminder",
            body: "Don't forget to complete your assignments!"
        },
        topic: "all_students"
    };

    try {
        await admin.messaging().send(message);
        res.status(200).send("Notification sent successfully!");
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Failed to send.");
    }
});