
import { useState, useEffect } from 'react';
import { Stack } from 'react-bootstrap';

import { ItemDTO } from '../../DTOs/ItemDTO';

import { Catalog } from '../catalog/Catalog';
import { Search } from './Search';


export function server
(
	signal  : AbortSignal,
	type    : string,
	search  : string,
	setData : React.Dispatch<React.SetStateAction<ItemDTO[]>>,
)
{
	fetch(`https://shikimori.one/api/${ type }?search=${ search }&limit=50`, { signal })
		.then(data => data.json())
		.then(data => setData(data))

		.catch(function (error)
		{
			if (error instanceof Error && error.name === 'AbortError')
			{
				return;
			}

			throw error;
		});
}

export function Sidebar ()
{
	const [ type,   setType   ] = useState('animes');
	const [ search, setSearch ] = useState('');

	const [ data, setData ] = useState<ItemDTO[]>([]);

	const next = function (): void
	{
	};

	useEffect(function ()
	{
		const abort = new AbortController();
		const timer = setTimeout(server.bind(undefined, abort.signal, type, search, setData), 1_000);

		return function ()
		{
			clearTimeout(timer);
			abort.abort();
		};
	}, [ type, search ]);

	return (
		<Stack as='aside' gap={2} className='bg-white p-2 rounded'>
			<Search {...{setType, type, setSearch, search}} />
			<Catalog {...{next, data, type}} />
		</Stack>
	);
}
