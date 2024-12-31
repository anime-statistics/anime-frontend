
import { Col } from 'react-bootstrap';
import { NavLink } from 'react-router-dom';

import { ItemDTO } from '../../DTOs/ItemDTO';

import { CatalogCard } from './CatalogCard';


export interface CatalogItemProps
{
	item : ItemDTO;
	type : string;
	size : number;
}

export function CatalogItem ({ item, type, size }: CatalogItemProps)
{
	return (
		<Col xs={size}>
			<NavLink to={ `/${ type }/${ item.id }` } className='text-decoration-none'>
				{ ({ isActive }) => <CatalogCard {...{isActive, item}} /> }
			</NavLink>
		</Col>
	);
}
