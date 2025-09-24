// Promotion Application User Roles
public enum Role {
    HR_ADMIN = "HR_ADMIN",
    PROMOTION_BOARD_MEMBER = "PROMOTION_BOARD_MEMBER",
    FUNCTIONAL_LEAD = "FUNCTIONAL_LEAD",
    EMPLOYEE = "EMPLOYEE",
    LEAD = "LEAD"
}

// Promotion Request Lifecycle Status.
public enum PromotionRequestStatus {
    DRAFT,
    SUBMITTED,
    WITHDRAW,
    REMOVED,
    EXPIRED,
    REJECTED,
    APPROVED,
    FL_REJECTED,
    FL_APPROVED,
    PROCESSING
}

// Promotion Cycle Status.
public enum PromotionCyclesStatus {
    OPEN,
    CLOSED,
    END
}

// Promotion Request Types.
public enum PromotionRequestType {
    NORMAL,
    TIME_BASED,
    INDIVIDUAL_CONTRIBUTOR
}
