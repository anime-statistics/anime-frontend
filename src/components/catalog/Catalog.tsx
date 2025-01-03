
import { useState } from 'react';
import { Form, Row, Spinner, Stack } from 'react-bootstrap';
import InfiniteScroll from 'react-infinite-scroll-component';

import { ItemDTO } from '../../DTOs/ItemDTO';

import { CatalogItem } from './CatalogItem';


export interface CatalogProps
{
	next : () => void;
	data : ItemDTO[];
	type : string;
}

export function Catalog ({ next, data, type }: CatalogProps)
{
	const [ size, setSize ] = useState(2);

	return (
		<>
			<Stack>
				<Form.Range
					title = 'set size'

					min   = {1}
					value = {size}
					max   = {12}

					onChange = { ev => setSize(Number(ev.target.value)) }
				/>
			</Stack>

			<InfiniteScroll
				dataLength = { data.length }
				next       = { next }

				hasMore = {true}
				loader  = {
					<Stack direction='horizontal' gap={2} className='justify-content-center m-5'>
						<Spinner />
						<h5 className='m-0'>Загрузка...</h5>
					</Stack>
				}
			>
				<Row>
					{ data.map((item, key) => <CatalogItem key={key} {...{item, type, size}} />) }
				</Row>
			</InfiniteScroll>
		</>
	);
}
