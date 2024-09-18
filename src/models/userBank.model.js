const bankDetailsSchema = new Schema(
  {
    account_no: String,
    ifsc_code: String,
    bank_name: String,
  },
  {
    timeseries: true,
  },
);

export const UserBank = mongoose.model("UserBank", bankDetailsSchema);
