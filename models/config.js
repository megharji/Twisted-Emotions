const mongoose = require ("mongoose")
mongoose.connect(process.env.MONGODB_URL)
        .then(()=>console.log("DB Connected"))
        .catch((err)=> console.log(err.message))