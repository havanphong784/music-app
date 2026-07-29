import {connect} from "mongoose";
const connectDb = async () =>{
    try {
        await connect(process.env.MONGODB_URI as string);
        console.log("MongoDB Connected!");
    } catch(err){
        console.log(err);
    }
}

export default connectDb;