import mongoose from 'mongoose';

export interface IRainfallData {
  taluka: string;
  rain_till_yesterday: number;
  rain_last_24hrs: number;
  total_rainfall: number;
  percent_against_avg: number;
  date: string; // e.g., "1st June", "2nd June", etc.
  createdAt: Date;
  updatedAt: Date;
}

const rainfallDataSchema = new mongoose.Schema<IRainfallData>({
  taluka: {
    type: String,
    required: true,
    index: true,
  },
  rain_till_yesterday: {
    type: Number,
    default: 0,
  },
  rain_last_24hrs: {
    type: Number,
    default: 0,
  },
  total_rainfall: {
    type: Number,
    default: 0,
  },
  percent_against_avg: {
    type: Number,
    default: 0,
  },
  date: {
    type: String,
    required: true,
    index: true,
  },
}, {
  timestamps: true,
});

// Create compound index for efficient queries
rainfallDataSchema.index({ date: 1, taluka: 1 });

// Prevent duplicate entries for same taluka and date
rainfallDataSchema.index({ date: 1, taluka: 1 }, { unique: true });

export default mongoose.models.RainfallData || mongoose.model<IRainfallData>('RainfallData', rainfallDataSchema); 