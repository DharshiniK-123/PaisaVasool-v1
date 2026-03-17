import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type { InvoiceRecord, PaymentRecord, DocumentType } from '../types/Document';
import { documentService } from '../services/documentService';
import { extractErrorMessage } from '../../../utils/errorUtils';

export type UploadProgressStatus =
  | 'idle'
  | 'uploading'
  | 'polling'
  | 'extracted'
  | 'saving'
  | 'saved'
  | 'failed';

export interface UploadProgressState {
  status:          UploadProgressStatus;
  jobId:           string | null;
  documentId:      number | null;
  fileName:        string | null;
  documentType:    DocumentType | null;
  previewRows:     (InvoiceRecord | PaymentRecord)[];
  error:           string | null;
  savedCount:      number | null;
  reviewRequested: boolean; // banner sets true → InlineUploadPanel auto-opens
}

const initialState: UploadProgressState = {
  status:          'idle',
  jobId:           null,
  documentId:      null,
  fileName:        null,
  documentType:    null,
  previewRows:     [],
  error:           null,
  savedCount:      null,
  reviewRequested: false,
};


export const startPollingThunk = createAsyncThunk(
  'uploadProgress/startPolling',
  async ({ jobId }: { jobId: string }, { rejectWithValue }) => {
    try {
      return await documentService.pollJobStatus(jobId);
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err));
    }
  }
);
export const saveProgressRecordsThunk = createAsyncThunk(
  'uploadProgress/save',
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


const uploadProgressSlice = createSlice({
  name: 'uploadProgress',
  initialState,
  reducers: {
    uploadStarted(state, action: PayloadAction<{
      jobId: string;
      documentId: number;
      fileName: string;
      documentType: DocumentType;
    }>) {
      state.status       = 'uploading';
      state.jobId        = action.payload.jobId;
      state.documentId   = action.payload.documentId;
      state.fileName     = action.payload.fileName;
      state.documentType = action.payload.documentType;
      state.previewRows  = [];
      state.error        = null;
      state.savedCount   = null;
    },

    pollingStarted(state) {
      state.status = 'polling';
      state.error  = null;
    },

    extractionDone(state, action: PayloadAction<(InvoiceRecord | PaymentRecord)[]>) {
      state.status      = 'extracted';
      state.previewRows = action.payload;
    },

    savingStarted(state) {
      state.status = 'saving';
      state.error  = null;
    },

    saveDone(state, action: PayloadAction<number>) {
      state.status     = 'saved';
      state.savedCount = action.payload;
    },

    uploadFailed(state, action: PayloadAction<string>) {
      state.status = 'failed';
      state.error  = action.payload;
    },

    // Banner clicked → signal the InlineUploadPanel to open and scroll into view
    requestReview(state) {
      state.reviewRequested = true;
    },

    // InlineUploadPanel acknowledges the signal and clears it
    clearReviewRequest(state) {
      state.reviewRequested = false;
    },

    updatePreviewRows(state, action: PayloadAction<(InvoiceRecord | PaymentRecord)[]>) {
      state.previewRows = action.payload;
    },

    reset: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(startPollingThunk.pending, (state) => {
        state.status = 'polling';
        state.error  = null;
      })
      .addCase(startPollingThunk.fulfilled, (state, action) => {
        state.status      = 'extracted';
        state.previewRows = action.payload.preview_data ?? [];
      })
      .addCase(startPollingThunk.rejected, (state, action) => {
        state.status = 'failed';
        state.error  = action.payload as string;
      });
    builder
      .addCase(saveProgressRecordsThunk.pending, (state) => {
        state.status = 'saving';
        state.error  = null;
      })
      .addCase(saveProgressRecordsThunk.fulfilled, (state, action) => {
        state.status     = 'saved';
        state.savedCount = action.payload.records_saved;
      })
      .addCase(saveProgressRecordsThunk.rejected, (state, action) => {
        state.status = 'failed';
        state.error  = action.payload as string;
      });
  },
});

export const {
  uploadStarted,
  pollingStarted,
  extractionDone,
  savingStarted,
  saveDone,
  uploadFailed,
  requestReview,
  clearReviewRequest,
  updatePreviewRows,
  reset,
} = uploadProgressSlice.actions;
export default uploadProgressSlice.reducer;