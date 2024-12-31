
import { Row } from 'react-bootstrap';
import InfiniteScroll from 'react-infinite-scroll-component';

import { ItemDTO } from '../../DTOs/ItemDTO';

import { CatalogItem } from './CatalogItem';


export interface CatalogProps
{
	next : () => void;
	data : ItemDTO[];
}

export function Catalog ({ next, data }: CatalogProps)
{
	return (
		<>
			<InfiniteScroll
				dataLength = { data.length }
				next       = { next }

				hasMore = {true}
				loader  = {
					<h5 className='m-5 text-center'>Загрузка...</h5>
				}
			>
				<Row>
					{ data.map((item, key) => <CatalogItem key={key} {...{item}} />) }
				</Row>
			</InfiniteScroll>
		</>
	);
}
