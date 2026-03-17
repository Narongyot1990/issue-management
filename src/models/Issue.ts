import mongoose, { Schema, model, models } from 'mongoose'

const HistoryEntrySchema = new Schema({
  action: { type: String, required: true },
  field: String,
  oldValue: String,
  newValue: String,
  note: String,
  createdAt: { type: Date, default: Date.now },
})

const IssueSchema = new Schema(
  {
    site: {
      type: String,
      enum: ['OPS', 'BBT', 'KSN', 'CBI', 'RA2', 'AYA'],
      required: true,
    },
    title: { type: String, required: true },
    plan: { type: String, default: '' },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved'],
      default: 'open',
    },
    openedDate: { type: Date, required: true, default: Date.now },
    dueDate: Date,
    resolvedDate: Date,
    sourceTopicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic' },
    history: [HistoryEntrySchema],
  },
  { timestamps: true }
)

export const Issue = models.Issue || model('Issue', IssueSchema)
