
import { useState, useEffect } from 'react';
import { Stack } from 'react-bootstrap';
import { useSearchParams } from 'react-router-dom';

import { ItemDTO } from '../../DTOs/ItemDTO';
import { RequestWithDelay } from '../../tools/requests/RequestWithDelay';

import { Catalog } from '../catalog/Catalog';
import { Search } from './Search';


export function Navigation ()
{
	const [ search_params, setSearchParams ] = useSearchParams();

	const [ type,   setType   ] = useState(search_params.get('type') || 'animes');
	const [ page,   setPage   ] = useState(Number(search_params.get('page') || '1'));
	const [ limit,  setLimit  ] = useState(Number(search_params.get('limit') || '50'));
	const [ search, setSearch ] = useState(search_params.get('search') || '');

	const [ hasMore, setHasMore ] = useState(true);
	const [ data,    setData    ] = useState<ItemDTO[]>([]);

	const next = function (): void
	{
		setPage(page + 1);
	};

	useEffect(function ()
	{
		// useEffect запускается при инициализации.
		// Это приводило к установке page = 1 при инициализации.

		// Использование param_page приводит к неправильной логике.
		// При изменении зависимостей page = search_params.page.

		setHasMore(true);
		data.length > 0 && setPage(1);
		setData([]);
	}, [ type, search ]);

	useEffect(function ()
	{
		setSearchParams({
			page  : String(page),
			limit : String(limit),

			type,
			search,
		});

		const req = new RequestWithDelay(
			1_000,
			`https://shikimori.one/api/${ type }?page=${ page }&limit=${ limit }&search=${ search }`,

			function (response: any): void
			{
				setData(old => [...old, ...response]);

				if (response.length === 50)
				{
					return;
				}
	
				setHasMore(false);
			}
		);

		return req.dispose.bind(req);
	}, [ setSearchParams, type, page, limit, search ]);

	return (
		<Stack as='nav' gap={2} className='bg-white p-md-2 rounded'>
			<Search {...{setType, type, setSearch, search}} />
			<Catalog {...{next, hasMore, data, type}} />
		</Stack>
	);
}
