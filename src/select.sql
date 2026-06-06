select
    t.tenant_id,
    t.nombre as nombre_barberia,
    t.codigo as codigo_barberia,

    si.sale_item_id,
    si.sale_id,
    si.barber_user_id as barber_item_actual,
    s.user_id as barber_venta_id,

    concat(coalesce(u.nombre, ''), ' ', coalesce(u.apellido, '')) as barbero_venta,

    s.branch_id,
    s.fecha_creacion
from sale_item si
join sale s 
    on s.sale_id = si.sale_id
join tenant t
    on t.tenant_id = s.tenant_id
left join app_user u 
    on u.user_id = s.user_id
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



Estimado el sistema es :
1. Control de cajas (Ingresos y registros de gastos .)
2. ⁠Pagos de Barberos .
3. Reservas Online del cliente desde la app móvil. 
4. ⁠Fidelización de clientes mediante puntos. 
5. ⁠Configuración de Servicios, premios, promociones , sedes, barberos, Horarios de barberos.6.  En la App, mostramos Rol para el cliente, Rol para operaciones del barbero y Rol para el dueño.


update sale_item si
set barber_user_id = s.user_id
from sale s
where s.sale_id = si.sale_id
  and s.fecha_creacion::date between current_date - 1 and current_date
  and s.user_id is not null
  and si.barber_user_id is null;

dfdf

  extender dias 

  update subscription
set
    fecha_fin = now() + interval '5 day',
    fecha_renovacion = now() + interval '5 day',
    estado = 'TRIAL',
    trial = true
where tenant_id = 27;


activar premios y promociones

update subscription
set
    custom_rewards_enabled = true,
    promotions_enabled = true
where tenant_id = 27;


ACTIBVAR UN PLAN POR MES 



UPDATE subscription
SET
    plan = 'STARTER',
    estado = 'ACTIVE',
    trial = false,
    fecha_inicio = NOW(),
    fecha_fin = NOW() + INTERVAL '1 month'
WHERE tenant_id = 59;



UPDATE subscription
SET 
    plan = 'STARTER',
    estado = 'ACTIVE',
    trial = false,
    fecha_inicio = NOW(),
    fecha_fin = NOW() + INTERVAL '1 month',
    fecha_renovacion = NOW() + INTERVAL '1 month',
    precio_mensual = 39
WHERE tenant_id = 73;

WITH barberias_por_vencer AS (
    SELECT
        t.tenant_id,
        t.nombre AS barberia,
        t.codigo AS codigo_barberia,
        s.plan,
        s.estado,
        s.trial,
        s.fecha_fin,
        (s.fecha_fin::date - CURRENT_DATE) AS dias_para_vencer
    FROM subscription s
    JOIN tenant t ON t.tenant_id = s.tenant_id
    WHERE s.fecha_fin IS NOT NULL
      AND s.estado IN ('ACTIVE', 'TRIAL')
      AND s.fecha_fin::date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
),

ventas AS (
    SELECT
        tenant_id,
        COUNT(*) AS total_ventas,
        COALESCE(SUM(total), 0) AS monto_total_ventas,
        COALESCE(SUM(total) FILTER (
            WHERE fecha_creacion::date >= CURRENT_DATE - INTERVAL '7 days'
        ), 0) AS ventas_ultimos_7_dias
    FROM sale
    GROUP BY tenant_id
),

clientes AS (
    SELECT
        tenant_id,
        COUNT(*) AS total_clientes
    FROM customer
    GROUP BY tenant_id
),

transacciones AS (
    SELECT
        tenant_id,
        COUNT(*) AS total_transacciones,
        COALESCE(SUM(amount), 0) AS monto_total_transacciones
    FROM cash_movement
    GROUP BY tenant_id
)

SELECT
    bpv.tenant_id,
    bpv.barberia,
    bpv.codigo_barberia,
    bpv.plan,
    bpv.estado,
    bpv.trial,
    bpv.fecha_fin,
    bpv.dias_para_vencer,

    COALESCE(c.total_clientes, 0) AS total_clientes,

    COALESCE(v.total_ventas, 0) AS total_ventas,
    COALESCE(v.monto_total_ventas, 0) AS monto_total_ventas,
    COALESCE(v.ventas_ultimos_7_dias, 0) AS ventas_ultimos_7_dias,

    COALESCE(t.total_transacciones, 0) AS total_transacciones,
    COALESCE(t.monto_total_transacciones, 0) AS monto_total_transacciones

FROM barberias_por_vencer bpv
LEFT JOIN clientes c ON c.tenant_id = bpv.tenant_id
LEFT JOIN ventas v ON v.tenant_id = bpv.tenant_id
LEFT JOIN transacciones t ON t.tenant_id = bpv.tenant_id
ORDER BY bpv.fecha_fin ASC;







WITH barberias_por_vencer AS (
    SELECT
        t.tenant_id,
        t.nombre AS barberia,
        t.codigo AS codigo_barberia,
        s.plan,
        s.estado,
        s.trial,
        s.fecha_fin,
        (s.fecha_fin::date - CURRENT_DATE) AS dias_para_vencer
    FROM subscription s
    JOIN tenant t ON t.tenant_id = s.tenant_id
    WHERE s.fecha_fin IS NOT NULL
      AND s.estado IN ('ACTIVE', 'TRIAL')
      AND s.fecha_fin::date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
),

ventas AS (
    SELECT
        tenant_id,
        COUNT(*) AS total_ventas,
        COALESCE(SUM(total), 0) AS monto_total_ventas,
        COALESCE(SUM(total) FILTER (
            WHERE fecha_creacion::date >= CURRENT_DATE - INTERVAL '30 days'
        ), 0) AS ventas_ultimos_7_dias
    FROM sale
    GROUP BY tenant_id
),

clientes AS (
    SELECT
        tenant_id,
        COUNT(*) AS total_clientes
    FROM customer
    GROUP BY tenant_id
),

transacciones AS (
    SELECT
        tenant_id,
        COUNT(*) AS total_transacciones,
        COALESCE(SUM(amount), 0) AS monto_total_transacciones
    FROM cash_movement
    GROUP BY tenant_id
)

SELECT
    bpv.tenant_id,
    bpv.barberia,
    bpv.codigo_barberia,
    bpv.plan,
    bpv.estado,
    bpv.trial,
    bpv.fecha_fin,
    bpv.dias_para_vencer,

    COALESCE(c.total_clientes, 0) AS total_clientes,

    COALESCE(v.total_ventas, 0) AS total_ventas,
    COALESCE(v.monto_total_ventas, 0) AS monto_total_ventas,
    COALESCE(v.ventas_ultimos_7_dias, 0) AS ventas_ultimos_7_dias,

    COALESCE(t.total_transacciones, 0) AS total_transacciones,
    COALESCE(t.monto_total_transacciones, 0) AS monto_total_transacciones

FROM barberias_por_vencer bpv
LEFT JOIN clientes c ON c.tenant_id = bpv.tenant_id
LEFT JOIN ventas v ON v.tenant_id = bpv.tenant_id
LEFT JOIN transacciones t ON t.tenant_id = bpv.tenant_id
ORDER BY bpv.fecha_fin ASC;





victor 91
carlos 77.5
karlos 27.5   



WITH barberias_vencidas AS (
    SELECT
        t.tenant_id,
        t.nombre AS barberia,
        t.codigo AS codigo_barberia,
        s.plan,
        s.estado,
        s.trial,
        s.fecha_fin,
        (CURRENT_DATE - s.fecha_fin::date) AS dias_vencido,
        CASE
            WHEN s.fecha_fin::date = CURRENT_DATE - INTERVAL '1 day'
                THEN 'VENCIO_AYER'
            ELSE 'VENCIO_ULTIMOS_7_DIAS'
        END AS grupo_vencimiento
    FROM subscription s
    JOIN tenant t ON t.tenant_id = s.tenant_id
    WHERE s.fecha_fin IS NOT NULL
      AND s.fecha_fin::date BETWEEN CURRENT_DATE - INTERVAL '7 days'
                              AND CURRENT_DATE - INTERVAL '1 day'
      AND s.estado IN ('ACTIVE', 'TRIAL', 'EXPIRED', 'CANCELLED')
),

ventas AS (
    SELECT
        tenant_id,
        COUNT(*) AS total_ventas,
        COALESCE(SUM(total), 0) AS monto_total_ventas,
        COALESCE(SUM(total) FILTER (
            WHERE fecha_creacion::date >= CURRENT_DATE - INTERVAL '7 days'
        ), 0) AS ventas_ultimos_7_dias
    FROM sale
    GROUP BY tenant_id
),

clientes AS (
    SELECT
        tenant_id,
        COUNT(*) AS total_clientes
    FROM customer
    GROUP BY tenant_id
),

transacciones AS (
    SELECT
        tenant_id,
        COUNT(*) AS total_transacciones,
        COALESCE(SUM(amount), 0) AS monto_total_transacciones
    FROM cash_movement
    GROUP BY tenant_id
)

SELECT
    bv.tenant_id,
    bv.barberia,
    bv.codigo_barberia,
    bv.plan,
    bv.estado,
    bv.trial,
    bv.fecha_fin,
    bv.dias_vencido,
    bv.grupo_vencimiento,

    COALESCE(c.total_clientes, 0) AS total_clientes,

    COALESCE(v.total_ventas, 0) AS total_ventas,
    COALESCE(v.monto_total_ventas, 0) AS monto_total_ventas,
    COALESCE(v.ventas_ultimos_7_dias, 0) AS ventas_ultimos_7_dias,

    COALESCE(t.total_transacciones, 0) AS total_transacciones,
    COALESCE(t.monto_total_transacciones, 0) AS monto_total_transacciones

FROM barberias_vencidas bv
LEFT JOIN clientes c ON c.tenant_id = bv.tenant_id
LEFT JOIN ventas v ON v.tenant_id = bv.tenant_id
LEFT JOIN transacciones t ON t.tenant_id = bv.tenant_id
ORDER BY bv.fecha_fin DESC;