import { useAppDispatch, useAppSelector } from '../../../hooks/redux';
import {
  uploadDocumentThunk,
  fetchPreviewThunk,
  fetchDocumentsThunk,
  resetUpload,
  clearUploadError,
} from '../slices/documentSlice';
import type { DocumentType } from '../types/Document';

export const useDocumentUpload = () => {
  const dispatch = useAppDispatch();
  const {
    uploading,
    uploadError,
    uploadedDocumentId,
    uploadedFileName,
    previewRows,
    previewLoading,
    previewError,
    documents,
    documentsLoading,
    documentsError,
  } = useAppSelector((state) => state.documents);

  const upload = async (file: File, documentType: DocumentType) => {
    const result = await dispatch(uploadDocumentThunk({ file, documentType }));
    if (uploadDocumentThunk.fulfilled.match(result)) {
      // Auto-fetch preview right after successful upload
      await dispatch(fetchPreviewThunk({
        documentId: result.payload.document_id,
        documentType,
      }));
      return true;
    }
    return false;
  };

  const fetchDocuments = () => dispatch(fetchDocumentsThunk());

  const reset = () => dispatch(resetUpload());

  return {
    // state
    uploading,
    uploadError,
    uploadedDocumentId,
    uploadedFileName,
    previewRows,
    previewLoading,
    previewError,
    documents,
    documentsLoading,
    documentsError,

    // actions
    upload,
    fetchDocuments,
    reset,
    clearUploadError: () => dispatch(clearUploadError()),
  };
};