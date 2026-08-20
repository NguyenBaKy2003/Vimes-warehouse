import {createApp} from "./app"
const app= createApp();
const PORT= process.env.PORT ? Number(process.env.PORT) : 3000;

app.listen(PORT,()=>{
     console.log(`Vimes Warehouse Receipt API đang chạy tại http://localhost:${PORT}`);
})
