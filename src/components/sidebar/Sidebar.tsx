
import { useState } from 'react';
import { Stack } from 'react-bootstrap';

import { Catalog } from '../catalog/Catalog';
import { Search } from './Search';


export function Sidebar ()
{
	const [ type,   setType   ] = useState('');
	const [ search, setSearch ] = useState('');

	const [ data, setData ] = useState([]);

	const next = function (): void
	{
	};

	return (
		<Stack as='aside' gap={2} className='bg-white p-2 rounded'>
			<Search {...{setType, type, setSearch, search}} />
			<Catalog {...{next, data}} />
		</Stack>
	);
}
