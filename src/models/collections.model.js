import mongoose from "mongoose";
import MongooseDelete from "mongoose-delete";

const collectionSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        slug: {
            type: String,
            required: true,
        },
        heading: {
            type: String,
            trim: true,
        },
        image: {
            type: String,
        },      
        sr_no: {
            type: Number,
            required: true,
        },  
        industry: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Industries",
            required: true, 
        }, 
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Categories",
            required: true, 
        }, 
        subcategory: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "SubCategories",
            required: true, 
        }, 


        isDeleted: {
            type: Boolean, default: false,
        },

    },
    {timestamps: true},
);

collectionSchema.pre("save", function (next) {
    if (this.name) {
        this.name = this.name.toLowerCase();
    }
    next();
});

collectionSchema.pre("findOneAndUpdate", function (next) {
    const update = this.getUpdate();
    if (update.name) {
        update.name = update.name.toLowerCase();
        this.setUpdate(update);
    }
    next();
});


collectionSchema.set("toJSON", {
  virtuals: true,
  transform: function (doc, ret) {
    delete ret.__v;
    ret.id = ret._id;
    delete ret._id;
    return ret;
  },
});

collectionSchema.plugin(MongooseDelete, { deleted: true, overrideMethods: 'all' });



export const Collections = mongoose.model("Collections", collectionSchema);
