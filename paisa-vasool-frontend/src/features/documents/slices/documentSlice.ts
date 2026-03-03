import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { documentService } from '../services/documentService';
import { extractErrorMessage } from '../../../utils/errorUtils';
import type { DocumentState, DocumentType } from '../types/Document';

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const uploadDocumentThunk = createAsyncThunk(
  'documents/upload',
  async ({ file, documentType }: { file: File; documentType: DocumentType }, { rejectWithValue }) => {
    try {
      return await documentService.upload(file, documentType);
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err));
    }
  }
);

export const fetchPreviewThunk = createAsyncThunk(
  'documents/fetchPreview',
  async ({ documentId, documentType }: { documentId: number; documentType: DocumentType }, { rejectWithValue }) => {
    try {
      if (documentType === 'INVOICE') {
        return await documentService.getInvoices(documentId);
      } else {
        return await documentService.getPayments(documentId);
      }
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err));
    }
  }
);

export const fetchDocumentsThunk = createAsyncThunk(
  'documents/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      return await documentService.list();
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err));
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const initialState: DocumentState = {
  uploading: false,
  uploadError: null,
  uploadedDocumentId: null,
  uploadedFileName: null,

  previewRows: [],
  previewLoading: false,
  previewError: null,

  documents: [],
  documentsLoading: false,
  documentsError: null,
};

const documentSlice = createSlice({
  name: 'documents',
  initialState,
  reducers: {
    resetUpload(state) {
      state.uploading = false;
      state.uploadError = null;
      state.uploadedDocumentId = null;
      state.uploadedFileName = null;
      state.previewRows = [];
      state.previewLoading = false;
      state.previewError = null;
    },
    clearUploadError(state) {
      state.uploadError = null;
    },
  },
  extraReducers: (builder) => {
    // upload
    builder
      .addCase(uploadDocumentThunk.pending, (state) => {
        state.uploading = true;
        state.uploadError = null;
        state.uploadedDocumentId = null;
        state.uploadedFileName = null;
        state.previewRows = [];
      })
      .addCase(uploadDocumentThunk.fulfilled, (state, action) => {
        state.uploading = false;
        state.uploadedDocumentId = action.payload.document_id;
        state.uploadedFileName = action.payload.file_name;
      })
      .addCase(uploadDocumentThunk.rejected, (state, action) => {
        state.uploading = false;
        state.uploadError = action.payload as string;
      });

    // preview
    builder
      .addCase(fetchPreviewThunk.pending, (state) => {
        state.previewLoading = true;
        state.previewError = null;
        state.previewRows = [];
      })
      .addCase(fetchPreviewThunk.fulfilled, (state, action) => {
        state.previewLoading = false;
        state.previewRows = action.payload;
      })
      .addCase(fetchPreviewThunk.rejected, (state, action) => {
        state.previewLoading = false;
        state.previewError = action.payload as string;
      });

    // list
    builder
      .addCase(fetchDocumentsThunk.pending, (state) => {
        state.documentsLoading = true;
        state.documentsError = null;
      })
      .addCase(fetchDocumentsThunk.fulfilled, (state, action) => {
        state.documentsLoading = false;
        state.documents = action.payload;
      })
      .addCase(fetchDocumentsThunk.rejected, (state, action) => {
        state.documentsLoading = false;
        state.documentsError = action.payload as string;
      });
  },
});

export const { resetUpload, clearUploadError } = documentSlice.actions;
export default documentSlice.reducer;