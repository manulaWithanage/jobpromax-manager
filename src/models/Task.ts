import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITask extends Document {
    name: string;
    assignee: string;
    status: 'In Progress' | 'In Review' | 'Blocked' | 'Done';
    dueDate: string;
    priority?: 'High' | 'Medium' | 'Low';
    createdAt: Date;
    updatedAt: Date;
}

const TaskSchema = new Schema<ITask>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        assignee: {
            type: String,
            required: true,
            trim: true,
        },
        status: {
            type: String,
            required: true,
            enum: ['In Progress', 'In Review', 'Blocked', 'Done'],
            default: 'In Progress',
        },
        dueDate: {
            type: String,
            required: true,
        },
        priority: {
            type: String,
            enum: ['High', 'Medium', 'Low'],
            default: 'Medium',
        },
    },
    {
        timestamps: true,
    }
);

// Transform _id to id when converting to JSON
TaskSchema.set('toJSON', {
    transform: function (doc, ret: any) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
    },
});

const Task: Model<ITask> = mongoose.models.Task || mongoose.model<ITask>('Task', TaskSchema);

export default Task;
