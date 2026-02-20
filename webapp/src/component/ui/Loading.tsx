import { CircularProgress, Grid, LinearProgress, Typography } from "@mui/material";

export const LoadingEffect = (props: { message: string | null; isCircularLoading?: boolean }) => {
  return (
    <>
      <Grid
        size={12}
        style={{
          display: "flex",
          justifyContent: "center",
          paddingTop: "50px",
        }}
      >
        {props.isCircularLoading ? <CircularProgress /> : <LinearProgress sx={{ width: "70px" }} />}
      </Grid>
      
      <Grid
        size={12}
        style={{
          display: "flex",
          justifyContent: "center",
          paddingTop: "30px",
        }}
      >
        <Typography variant="h5">{props.message}</Typography>
      </Grid>
    </>
  );
};