import mongoose from 'mongoose';

const ABTestSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['ab', 'multivariate', 'split_url', 'personalization'],
    default: 'ab'
  },
  status: {
    type: String,
    enum: ['draft', 'running', 'paused', 'completed', 'cancelled'],
    default: 'draft'
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date
  },
  trafficAllocation: {
    type: Number,
    min: 0,
    max: 100,
    default: 100
  },
  variants: [{
    id: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    description: {
      type: String
    },
    trafficWeight: {
      type: Number,
      min: 0,
      max: 100,
      default: 50
    },
    config: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  }],
  metrics: {
    primary: {
      type: String,
      required: true
    },
    secondary: [{
      type: String
    }],
    conversionEvents: [{
      type: String
    }]
  },
  segments: [{
    segmentId: {
      type: String,
      required: true
    },
    weight: {
      type: Number,
      min: 0,
      max: 100,
      default: 100
    }
  }],
  advancedSettings: {
    minimumDetectableEffect: {
      type: Number,
      default: 0.05
    },
    statisticalPower: {
      type: Number,
      default: 0.8
    },
    significanceLevel: {
      type: Number,
      default: 0.05
    },
    maxDuration: {
      type: Number,
      default: 30
    },
    minSampleSize: {
      type: Number,
      default: 1000
    },
    earlyStopping: {
      type: Boolean,
      default: false
    },
    bayesianAnalysis: {
      type: Boolean,
      default: false
    }
  },
  results: {
    totalParticipants: {
      type: Number,
      default: 0
    },
    totalConversions: {
      type: Number,
      default: 0
    },
    overallConversionRate: {
      type: Number,
      default: 0
    },
    variantResults: [{
      variantId: String,
      participants: Number,
      conversions: Number,
      conversionRate: Number,
      confidenceInterval: {
        lower: Number,
        upper: Number
      },
      statisticalSignificance: Number,
      bayesianProbability: Number,
      lift: Number
    }],
    statisticalTests: {
      chiSquare: {
        statistic: Number,
        pValue: Number,
        significant: Boolean
      },
      fisherExact: {
        pValue: Number,
        significant: Boolean
      },
      bayesian: {
        probability: Number,
        credibleInterval: {
          lower: Number,
          upper: Number
        }
      }
    },
    recommendations: {
      winningVariant: String,
      confidence: {
        type: String,
        enum: ['low', 'medium', 'high']
      },
      recommendation: String,
      nextSteps: [String]
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

export default mongoose.models.ABTest || mongoose.model('ABTest', ABTestSchema);