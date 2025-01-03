
import { useState } from 'react';
import { Stack } from 'react-bootstrap';

import { Header } from '../header/Header';
import { Sidebar } from '../sidebar/Sidebar';


export function Foundation ()
{
	const [ visibility, setVisibility ] = useState(false);

	const setShow = () => setVisibility(true);
	const setHide = () => setVisibility(false);

	return (
		<>
			<Header {...{setShow}} />

			<Stack className='p-2 bg-light'>
				<Sidebar show={visibility} {...{setHide}} />
			</Stack>
		</>
	);
}
