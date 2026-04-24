select
    si.sale_item_id,
    si.sale_id,
    si.barber_user_id as barber_item_actual,
    s.user_id as barber_venta_id,
    concat(coalesce(u.nombre, ''), ' ', coalesce(u.apellido, '')) as barbero_venta,
    s.fecha_creacion
from sale_item si
join sale s on s.sale_id = si.sale_id
left join app_user u on u.user_id = s.user_id
where s.fecha_creacion::date between current_date - 1 and current_date
order by s.fecha_creacion desc, si.sale_item_id desc;

select
    tenant_id,
    plan,
    estado,
    trial,
    fecha_inicio,
    fecha_renovacion,
    fecha_fin
from subscription
where tenant_id = 25;


update sale_item si
set barber_user_id = s.user_id
from sale s
where s.sale_id = si.sale_id
  and s.fecha_creacion::date between current_date - 1 and current_date
  and s.user_id is not null
  and si.barber_user_id is null;