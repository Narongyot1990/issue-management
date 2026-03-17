import mongoose, { Schema, model, models } from 'mongoose'

const HistoryEntrySchema = new Schema({
  action: { type: String, required: true },
  field: String,
  oldValue: String,
  newValue: String,
  note: String,
  createdAt: { type: Date, default: Date.now },
})

const ChecklistItemSchema = new Schema({
  text: { type: String, required: true },
  done: { type: Boolean, default: false },
})

const TopicSchema = new Schema(
  {
    date: { type: Date, required: true },
    site: {
      type: String,
      enum: ['OPS', 'BBT', 'KSN', 'CBI', 'RA2', 'AYA'],
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'blocked', 'done', 'cancelled'],
      default: 'open',
    },
    estCompletionDate: Date,
    actualCompletionDate: Date,
    items: [ChecklistItemSchema],
    whys: { type: mongoose.Schema.Types.Mixed, default: [] },
    linkedIssueId: { type: mongoose.Schema.Types.ObjectId, ref: 'Issue' },
    history: [HistoryEntrySchema],
  },
  { timestamps: true }
)

export const Topic = models.Topic || model('Topic', TopicSchema)
