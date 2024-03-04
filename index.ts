import { app } from "./app";
// import connectDB from "./config/db";
import { serverPort } from "./secret";

// connectDB()
// 	.then(() => {
// 		app.listen(serverPort, () => {
// 			console.log(`server is connected with port ${serverPort}`);
// 		});
// 	})
// 	.catch((error) => {
// 		console.log(`DB connection Failed with error: `, error);
// 	});
app.listen(serverPort, () => {
    console.log(`server is connected with port1 ${serverPort}`);
});