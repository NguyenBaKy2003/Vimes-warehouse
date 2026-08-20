import { Request, Response } from "express";
import { createGoodsReceiptNote, deleteGoodsReceiptNote, getGoodsReceiptNoteById, listGoodsReceiptNotes, NotFoundError, ValidationError } from "../services/goodsReceiptService";



export async function createNoteHandler(req:Request, res: Response) {
    try{
        const note = await createGoodsReceiptNote(req.body);
        res.status(201).json(note);
    }
    catch(err){
        if(err instanceof ValidationError){
            return res.status(400).json({message: "Du lieu khong hop le", errors: err.errors});

        }
        console.error(err);
        res.status(500).json({message: "Loi he thong"});
    }
}


export async function getNoteHandler(req: Request, res: Response){
    try{
        const id= Number(req.params.id);
        const note= await getGoodsReceiptNoteById(id);
        res.json(note);
    }
    catch (err){
        if( err instanceof NotFoundError){
            return res.status(404).json({message: err.message});
        }
        console.error(err);
        res.status(500).json({message: "Loi he thong"});
    }
}

export async function listNotesHandler(req:Request, res: Response) {
    try{
        const limit = req.query.limit ? Number(req.query.limit): 50;
        const offet = req.query.offset ? Number(req.query.offset): 0;
        const notes = await listGoodsReceiptNotes(limit, offet);
        res.json(notes);
    }
    catch(err){
        console.error(err);
        res.status(500).json({message: "Loi he thong"});
    }
}

export async function deleteNoteHandler(req:Request, res: Response) {
    try{
        const id= Number(req.params.id);
        await deleteGoodsReceiptNote(id);
        res.status(204).send();
    }

    catch(err){
        console.error(err);
        res.status(500).json({message: "Loi he thong"});
    }
    
}