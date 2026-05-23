import * as React from 'react';
import Paper from '@mui/material/Paper';
import InputBase from '@mui/material/InputBase';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import SearchIcon from '@mui/icons-material/Search';

export default function Search(props: {
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  value: string;
}) {
  return (
    <Paper
      component="form"
      variant='outlined'
      sx={{ p: '2px 4px', display: 'flex', alignItems: 'center', width: 300 ,border:"none"}}
    >
      <InputBase
        sx={{ ml: 1, flex: 1 }}
        placeholder="Search"
        inputProps={{ 'aria-label': 'search' }}
        onChange={props.onChange}
      />
      <IconButton type="button" size="small" aria-label="search">
        <SearchIcon />
      </IconButton>
    </Paper>
  );
}
