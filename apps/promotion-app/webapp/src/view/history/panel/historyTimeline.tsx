import CustomizedTimeline from '@component/common/TimeLine';
import { useAppSelector, RootState } from "@slices/store";

export default function History() {

    const user = useAppSelector((state: RootState) => state.user);

    return (
        <>
            {user.userInfo?.workEmail && (
                <CustomizedTimeline employeeEmail={user.userInfo.workEmail} />
            )}
        </>
    );
}

