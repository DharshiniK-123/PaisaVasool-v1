import { useAppDispatch, useAppSelector } from '../../../hooks/redux';
import {uploadDocumentThunk,pollJobStatusThunk,saveRecordsThunk,fetchDocumentsThunk,resetUpload,clearUploadError,updatePreviewRows,} from '../slices/documentSlice';
import type { DocumentType, InvoiceRecord, PaymentRecord } from '../types/Document';

export const useDocumentUpload = () => {
  const dispatch = useAppDispatch();
  const {
    uploading, uploadError,
    uploadedDocumentId, uploadedFileName, uploadedJobId,
    processing, processError,
    previewRows,
    saving, saveError, savedCount,
    documents, documentsLoading, documentsError,
  } = useAppSelector((state) => state.documents);

  const upload = async (file: File, documentType: DocumentType) => {
    const uploadResult = await dispatch(uploadDocumentThunk({ file, documentType }));
    if (!uploadDocumentThunk.fulfilled.match(uploadResult)) return false;
    const { job_id } = uploadResult.payload;
    const pollResult = await dispatch(pollJobStatusThunk({ jobId: job_id }));
    if (!pollJobStatusThunk.fulfilled.match(pollResult)) return false;

    return true;
  };
  const save = async (
    documentType: DocumentType,
    records: (InvoiceRecord | PaymentRecord)[],
  ) => {
    if (!uploadedDocumentId) return false;
    const result = await dispatch(saveRecordsThunk({
      documentId: uploadedDocumentId,
      documentType,
      records,
    }));
    return saveRecordsThunk.fulfilled.match(result);
  };

  const updateRows = (rows: (InvoiceRecord | PaymentRecord)[]) => {
    dispatch(updatePreviewRows(rows));
  };

  const fetchDocuments = () => dispatch(fetchDocumentsThunk());
  const reset = () => dispatch(resetUpload());

  return {
    uploading,
    processing,
    saving,
    isProcessing: uploading || processing,
    uploadError,
    processError,
    saveError,
    error: uploadError || processError || saveError || null,
    uploadedDocumentId,
    uploadedFileName,
    uploadedJobId,
    previewRows,
    savedCount,
    documents,
    documentsLoading,
    documentsError,

    
    upload,      
    save,        
    updateRows, 
    fetchDocuments,
    reset,
    clearUploadError: () => dispatch(clearUploadError()),
  };
};