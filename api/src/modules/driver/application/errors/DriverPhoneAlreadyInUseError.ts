export class DriverPhoneAlreadyInUseError extends Error {
  constructor() {
    super("DRIVER_PHONE_ALREADY_IN_USE");
    this.name = "DriverPhoneAlreadyInUseError";
  }
}
