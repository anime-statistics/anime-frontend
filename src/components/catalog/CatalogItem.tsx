
import { Col } from 'react-bootstrap';

import { ItemDTO } from '../../DTOs/ItemDTO';

import { CatalogCard } from './CatalogCard';


export interface CatalogItemProps
{
	item : ItemDTO;
	size : number;
}

export function CatalogItem ({ item, size }: CatalogItemProps)
{
	return (
		<Col xs={size}>
			<CatalogCard {...item} />
		</Col>
	);
}
