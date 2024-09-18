const userAddressSchema = new Schema(
    {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
    },
    {
      timeseries: true,
    },
  );


  export const UserAddress = mongoose.model("UserAddress", userAddressSchema);