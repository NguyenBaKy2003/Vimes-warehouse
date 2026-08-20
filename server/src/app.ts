import express from "express";
import path from "path";
import goodsReceiptRoutes from "./routes/goodsReceiptRoutes";
import { start } from "repl";

export function createApp(){
    const app= express();
    app.use(express.json());
    app.use(express.static(path.join(__dirname, "..","public")));
    app.use("/api", goodsReceiptRoutes);
    app.get("/api/health", (_req,res)=>{
        res.json({sttus:"ok"});
    })
    return app;
}