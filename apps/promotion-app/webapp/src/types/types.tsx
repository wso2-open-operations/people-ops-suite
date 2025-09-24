export enum ConfirmationType {
  update = "update",
  send = "send",
  upload = "upload",
  accept = "accept",
}

export enum State {
  failed = "failed",
  success = "success",
  loading = "loading",
  idle = "idle",
}

export enum ApplicationState {
  REQUESTED = "REQUESTED",
  ACTIVE = "ACTIVE",
  SUBMITTED = "SUBMITTED",
  DRAFT = "DRAFT",
  DECLINED = "DECLINED",
  WITHDRAW = "WITHDRAW",
  REMOVED = "REMOVED",
  FL_APPROVED = "FL_APPROVED",
  APPROVED = "APPROVED",
  FL_REJECTED = "FL_REJECTED",
  REJECTED = "REJECTED",
  EXPIRED = "EXPIRED",
  PROCESSING = "PROCESSING",
}

export enum RecommendationState {
  REQUESTED = "REQUESTED",
  SUBMITTED = "SUBMITTED",
  DECLINED = "DECLINED",
  EXPIRED = "EXPIRED",
}
