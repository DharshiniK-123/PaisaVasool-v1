import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { documentService } from '../services/documentService';
import { extractErrorMessage } from '../../../utils/errorUtils';
import type { DocumentState, DocumentType, InvoiceRecord, PaymentRecord } from '../types/Document';

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

export const pollJobStatusThunk = createAsyncThunk(
  'documents/pollJobStatus',
  async ({ jobId }: { jobId: string }, { rejectWithValue }) => {
    try {
      return await documentService.pollJobStatus(jobId);
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err));
    }
  }
);

export const saveRecordsThunk = createAsyncThunk(
  'documents/saveRecords',
  async (
    { documentId, documentType, records }: {
      documentId: number;
      documentType: DocumentType;
      records: (InvoiceRecord | PaymentRecord)[];
    },
    { rejectWithValue }
  ) => {
    try {
      return await documentService.saveRecords(documentId, documentType, records);
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


const initialState: DocumentState = {
  uploading:         false,
  uploadError:       null,
  uploadedDocumentId: null,
  uploadedFileName:  null,
  uploadedJobId:     null,
  processing:   false,
  processError: null,
  previewRows: [],
  saving:     false,
  saveError:  null,
  savedCount: null,
  documents:        [],
  documentsLoading: false,
  documentsError:   null,
};

const documentSlice = createSlice({
  name: 'documents',
  initialState,
  reducers: {
    resetUpload(state) {
      state.uploading          = false;
      state.uploadError        = null;
      state.uploadedDocumentId = null;
      state.uploadedFileName   = null;
      state.uploadedJobId      = null;
      state.processing         = false;
      state.processError       = null;
      state.previewRows        = [];
      state.saving             = false;
      state.saveError          = null;
      state.savedCount         = null;
    },
    clearUploadError(state) {
      state.uploadError  = null;
      state.processError = null;
      state.saveError    = null;
    },
    updatePreviewRows(state, action) {
      state.previewRows = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(uploadDocumentThunk.pending, (state) => {
        state.uploading          = true;
        state.uploadError        = null;
        state.uploadedDocumentId = null;
        state.uploadedFileName   = null;
        state.uploadedJobId      = null;
        state.previewRows        = [];
        state.processing         = false;
        state.processError       = null;
        state.saving             = false;
        state.saveError          = null;
        state.savedCount         = null;
      })
      .addCase(uploadDocumentThunk.fulfilled, (state, action) => {
        state.uploading          = false;
        state.uploadedDocumentId = action.payload.document_id;
        state.uploadedFileName   = action.payload.file_name;
        state.uploadedJobId      = action.payload.job_id;
      })
      .addCase(uploadDocumentThunk.rejected, (state, action) => {
        state.uploading   = false;
        state.uploadError = action.payload as string;
      });
    builder
      .addCase(pollJobStatusThunk.pending, (state) => {
        state.processing   = true;
        state.processError = null;
      })
      .addCase(pollJobStatusThunk.fulfilled, (state, action) => {
        state.processing  = false;
        state.previewRows = action.payload.preview_data ?? [];
      })
      .addCase(pollJobStatusThunk.rejected, (state, action) => {
        state.processing   = false;
        state.processError = action.payload as string;
      });
    builder
      .addCase(saveRecordsThunk.pending, (state) => {
        state.saving    = true;
        state.saveError = null;
        state.savedCount = null;
      })
      .addCase(saveRecordsThunk.fulfilled, (state, action) => {
        state.saving     = false;
        state.savedCount = action.payload.records_saved;
      })
      .addCase(saveRecordsThunk.rejected, (state, action) => {
        state.saving    = false;
        state.saveError = action.payload as string;
      });
    builder
      .addCase(fetchDocumentsThunk.pending, (state) => {
        state.documentsLoading = true;
        state.documentsError   = null;
      })
      .addCase(fetchDocumentsThunk.fulfilled, (state, action) => {
        state.documentsLoading = false;
        state.documents        = action.payload;
      })
      .addCase(fetchDocumentsThunk.rejected, (state, action) => {
        state.documentsLoading = false;
        state.documentsError   = action.payload as string;
      });
  },
});

export const { resetUpload, clearUploadError, updatePreviewRows } = documentSlice.actions;
export default documentSlice.reducer;