import { Link } from "react-router-dom";
import PremiumBackground from "@/components/layout/PremiumBackground";
import LandingHeader from "@/components/landing/LandingHeader";

const TerminosPage = () => (
  <PremiumBackground>
    <LandingHeader />
    <article className="mx-auto max-w-3xl px-6 pt-32 pb-20 text-foreground">
      <header className="text-center">
        <p className="text-sm font-semibold tracking-widest text-primary">EL CARNAL</p>
        <p className="mt-1 text-xs text-muted-foreground">Inversiones El Carnal SAS · NIT: 830.115.239-9</p>
        <h1 className="mt-6 font-display text-3xl font-bold md:text-4xl">Términos y Condiciones</h1>
      </header>

      <div className="prose prose-invert mt-10 max-w-none space-y-4 text-muted-foreground prose-headings:text-foreground prose-strong:text-foreground prose-li:marker:text-primary">
        <p>
          Estos Términos y Condiciones ("Términos") rigen el uso de los servicios de pedidos en línea y presenciales proporcionados por Inversiones El Carnal SAS (en adelante "nosotros", "la Compañía" o "El Carnal"). Al acceder y utilizar nuestros canales de venta, incluyendo la página web, aplicaciones móviles y puntos de venta físicos, usted (en adelante "Usuario" o "Cliente") acepta haber leído, comprendido y aceptado todos los Términos aquí descritos. De no estar de acuerdo, por favor absténgase de utilizar nuestros servicios.
        </p>
        <p>
          El Carnal opera bajo la razón social Inversiones El Carnal SAS, con NIT 830.115.239-9, con domicilio principal en Bogotá D.C., Colombia, con presencia en más de 40 puntos de venta en Bogotá y Cundinamarca.
        </p>
        <p>
          Nuestros canales de venta pueden ser utilizados por personas naturales mayores de 18 años, o personas jurídicas. Los menores de 18 años podrán realizar pedidos únicamente a través de las cuentas asociadas a un adulto responsable, quien asumirá la responsabilidad plena por las transacciones efectuadas.
        </p>
        <p>
          El Carnal se reserva el derecho de modificar estos Términos en cualquier momento. El uso continuado de nuestros servicios tras la actualización implica la aceptación de los nuevos Términos.
        </p>

        <h2>1. Registro de Cuenta de Usuario</h2>
        <h3>1.1 Creación de cuenta</h3>
        <p>Para acceder a todos los servicios de pedidos en línea de El Carnal, el Cliente deberá registrarse como usuario proporcionando información veraz, completa y actualizada, incluyendo nombre completo, correo electrónico, número de cédula de ciudadanía, número de teléfono y contraseña de acceso.</p>
        <h3>1.2 Responsabilidad del usuario</h3>
        <p>La contraseña de acceso es de uso estrictamente personal e intransferible. El Cliente será responsable de todas las transacciones realizadas desde su cuenta. El Carnal no será responsable por pedidos realizados a través de cuentas comprometidas por negligencia del usuario.</p>
        <h3>1.3 Información incompleta o errónea</h3>
        <p>El Carnal no se hará responsable por inconvenientes derivados de información incorrecta o incompleta suministrada por el Cliente al momento del registro o durante la realización de un pedido.</p>
        <h3>1.4 Cancelación de cuenta</h3>
        <p>El Cliente que desee cancelar su cuenta deberá enviar una solicitud al correo info@elcarnal.com.co. El Carnal se reserva el derecho de suspender, inactivar o eliminar cuentas en los siguientes casos:</p>
        <ul>
          <li>Cuando la cuenta esté siendo utilizada por terceros no autorizados.</li>
          <li>Cuando se detecte cualquier actividad fraudulenta, abusiva o contraria a estos Términos.</li>
        </ul>

        <h2>2. Restricciones y Conductas Prohibidas</h2>
        <h3>2.1 Actividades prohibidas</h3>
        <p>Queda expresamente prohibido en los canales de El Carnal:</p>
        <ul>
          <li>Realizar compras con documentos de identidad falsos o instrumentos financieros robados o fraudulentos.</li>
          <li>Adquirir productos de venta restringida siendo menor de edad, o para ser entregados a menores de edad.</li>
          <li>Realizar cualquier uso no autorizado del contenido, marcas, imágenes o información de nuestra plataforma.</li>
          <li>Ejecutar conductas que restrinjan o impidan el uso de los servicios a otros usuarios o que expongan información confidencial de la Compañía o de sus clientes.</li>
        </ul>
        <h3>2.2 Facultades de la Compañía</h3>
        <p>El Carnal se reserva el derecho, sin estar obligada a ello, de:</p>
        <ul>
          <li>Investigar cualquier hecho o conducta que contravenga estos Términos.</li>
          <li>Bloquear o restringir el acceso a sus servicios a cualquier usuario que haya violado estas condiciones.</li>
        </ul>

        <h2>3. Propiedad Intelectual</h2>
        <p>Todos los logotipos, imágenes, nombre de marca, diseños, aplicaciones y material audiovisual publicados en los canales de El Carnal son propiedad intelectual de Inversiones El Carnal SAS o de terceros que han autorizado su uso. Queda expresamente prohibida su reproducción, modificación, distribución o uso comercial sin autorización escrita previa de la Compañía.</p>

        <h2>4. Productos Restringidos</h2>
        <h3>4.1 Restricciones legales</h3>
        <p>Algunos productos comercializados por El Carnal están sujetos a restricciones de venta establecidas por la normatividad colombiana, incluyendo límites de edad o restricciones horarias.</p>
        <h3>4.2 Bebidas alcohólicas</h3>
        <p>De conformidad con la Ley 124 de 1994, la venta de bebidas alcohólicas está restringida a mayores de edad. El Carnal y sus funcionarios se reservan el derecho de:</p>
        <ul>
          <li>Solicitar documento de identidad que acredite la mayoría de edad del receptor del pedido.</li>
          <li>Rechazar la entrega si el Cliente no puede acreditar su mayoría de edad.</li>
          <li>Rechazar cualquier pedido que genere dudas razonables sobre el cumplimiento de esta norma.</li>
        </ul>

        <h2>5. Pedidos</h2>
        <h3>5.1 Confirmación del pedido</h3>
        <p>Una vez completado el proceso de compra en línea, El Carnal enviará un correo electrónico de confirmación con el detalle del pedido, incluyendo productos, recargos por domicilio e impuestos aplicables (Impuesto al Consumo y/o IVA).</p>
        <h3>5.2 Instrucciones especiales</h3>
        <p>El Carnal hará su mejor esfuerzo para atender las instrucciones especiales comunicadas por el Cliente a través de los canales de atención. Sin embargo, cuando no sea posible o comercialmente viable, la Compañía procederá con los estándares de preparación establecidos, sin que ello genere derecho a reembolso.</p>
        <h3>5.3 Alergias e ingredientes</h3>
        <p>Si el Cliente requiere información sobre ingredientes o alérgenos presentes en los productos de El Carnal, deberá consultar a nuestro equipo de atención al cliente antes de realizar su pedido, a través del correo info@elcarnal.com.co o al teléfono 601 670 2872.</p>
        <h3>5.4 Proceso de pedido en línea</h3>
        <p>Para pedidos a domicilio, el Cliente debe ingresar su dirección de entrega para verificar cobertura. Para pedidos Pick Up, debe seleccionar el punto de venta donde recogerá su pedido y la hora de recogida. El pedido se considerará exitoso cuando el Cliente reciba el correo de confirmación.</p>
        <h3>5.5 Cancelación de pedidos Pick Up</h3>
        <p>El Cliente puede cancelar su pedido Pick Up comunicándose con nuestra línea de soporte. Para tener derecho a devolución, la cancelación debe realizarse con al menos 25 minutos de anticipación a la hora de recogida. Si el pedido ya está en preparación o listo, no habrá lugar a reembolso.</p>
        <h3>5.6 Cancelación de pedidos a domicilio</h3>
        <p>Los pedidos a domicilio pueden cancelarse siempre que no hayan sido facturados en el punto de venta, contactando al equipo de soporte a través del correo info@elcarnal.com.co o por nuestros canales de WhatsApp. Una vez facturado el pedido, no habrá lugar a reembolso.</p>
        <h3>5.7 Proceso de Devolución</h3>
        <p>Los tiempos de devolución del dinero están sujetos a las políticas de la pasarela de pagos utilizada y a los términos de la entidad financiera del Cliente. Los pagos contra entrega que sean cancelados después de la facturación del pedido implicarán la pérdida del derecho a realizar pagos con esta modalidad en el futuro.</p>
        <p>Para solicitar la reversión del pago, el Usuario deberá presentar la solicitud ante La Compañía dentro de los dos (2) días hábiles siguientes a la fecha en que se realizó la transacción. La solicitud deberá realizarse a través de los siguientes medios, dentro de los horarios de atención:</p>
        <ul>
          <li>Línea solo WhatsApp: 3232220276</li>
          <li>Correo electrónico: servicioalcliente@elcarnal.com.co</li>
        </ul>
        <p>El Usuario deberá indicar la siguiente información al momento de presentar la solicitud:</p>
        <ul>
          <li>Nombre completo</li>
          <li>Número de cédula</li>
          <li>Entidad financiera y tipo de cuenta</li>
          <li>Número de cuenta</li>
        </ul>
        <p>Una vez presentada la solicitud, La Compañía contará con un término de tres (3) días hábiles para hacer la revisión del caso y aplicar el reembolso correspondiente.</p>

        <h2>6. Precios y Medios de Pago</h2>
        <p><strong>6.1 Moneda:</strong> Todos los precios están expresados en pesos colombianos (COP) e incluyen Impuesto al Consumo y/o IVA según aplique para cada producto.</p>
        <p><strong>6.2 Transparencia de precios:</strong> Los detalles del precio total, incluyendo recargos adicionales como domicilio, se mostrarán antes de confirmar el pedido. Al finalizar la orden, el Cliente acepta todos los cargos asociados.</p>
        <p><strong>6.3 Recargo de domicilio:</strong> Aplica para todos los pedidos a domicilio, salvo cuando El Carnal adelante promociones especiales o el Cliente cuente con un cupón válido que elimine dicho recargo.</p>
        <p><strong>6.4 Variación de precios:</strong> El Carnal se reserva el derecho de modificar los precios sin previo aviso.</p>
        <p><strong>6.5 Medios de pago:</strong> Tarjeta de crédito/débito, PSE, y pago contra entrega en efectivo o datáfono (disponible exclusivamente para usuarios registrados en pedidos a domicilio). Inversiones El Carnal SAS no almacena información de tarjetas de pago; dicho procesamiento lo realiza exclusivamente la pasarela de pagos contratada.</p>
        <p>Los montos máximos de pago son los siguientes:</p>
        <ul>
          <li>Pago en efectivo: hasta $150.000 COP.</li>
          <li>Pago en línea (tarjeta/PSE): hasta $1.000.000 COP.</li>
        </ul>

        <h2>7. Entrega a Domicilio y Pick Up</h2>
        <h3>7.1 Cobertura de domicilios</h3>
        <p>La disponibilidad del servicio de domicilio se verificará automáticamente al ingresar la dirección del Cliente en la plataforma. Si no hay cobertura en su zona, El Carnal informará al Cliente y le ofrecerá la alternativa Pick Up en el punto más cercano.</p>
        <h3>7.2 Tiempos de entrega</h3>
        <p>El tiempo estimado de entrega es de hasta 60 a 90 minutos contados desde la confirmación del pedido. Los tiempos de entrega son estimados y pueden variar según condiciones de tráfico, clima, hora del pedido, tamaño del pedido y distancia. El Cliente acepta que el tiempo estimado es referencial y que la Compañía no se hace responsable por demoras debidas a factores externos.</p>
        <h3>7.3 Autorización de contacto</h3>
        <p>El Usuario acepta que tanto La Compañía como el domiciliario puedan contactarlo a través de llamadas telefónicas, correos electrónicos u otros medios disponibles, con el fin de garantizar la prestación oportuna y de calidad del servicio de entrega.</p>
        <h3>7.4 Pedidos no exitosos</h3>
        <p>Un pedido se considerará fallido cuando:</p>
        <ul>
          <li>El Cliente no esté presente en la dirección de entrega al momento de la llegada del domiciliario.</li>
          <li>No sea posible contactar al Cliente tras múltiples intentos al número registrado.</li>
          <li>La dirección de entrega no sea segura o accesible para el domiciliario.</li>
          <li>El Cliente no pueda acreditar mayoría de edad para productos restringidos.</li>
          <li>El domiciliario deba esperar más de 10 minutos sin poder completar la entrega.</li>
        </ul>
        <h3>7.5 Entrega en edificios y apartamentos</h3>
        <p>Las entregas directamente en el apartamento se harán únicamente si el Cliente lo solicita expresamente. Las siguientes condiciones aplican:</p>
        <ul>
          <li>Si el edificio permite el ingreso de domiciliarios, el pedido podrá entregarse directamente en el apartamento.</li>
          <li>Si el reglamento o la portería restringen el acceso por razones de seguridad, el domiciliario podrá entregar en la recepción o portería.</li>
          <li>El domiciliario seguirá la política de "hasta donde sea permitido el acceso", conforme a las normas del conjunto o edificio.</li>
          <li>Es importante que el Cliente deje instrucciones claras en el pedido (por ejemplo: "subir al apartamento", "entregar en portería", "llamar al llegar", etc.).</li>
          <li>Cuando no haya autorización expresa del conjunto o no sea posible el ingreso, el domiciliario no está obligado a subir al apartamento y podrá entregar en portería o recepción.</li>
        </ul>
        <h3>7.6 Órdenes incorrectas, incompletas o en mal estado</h3>
        <p>Si al recibir su pedido el Cliente detecta algún error (producto diferente, faltante o en mal estado), deberá comunicarlo de inmediato a través de nuestros canales de atención. En algunos casos, El Carnal podrá solicitar evidencia fotográfica. De confirmarse el error, la Compañía ofrecerá compensación parcial o total según corresponda.</p>
        <h3>7.7 Pick Up – Recogida en punto de venta</h3>
        <p>El punto de venta conservará el pedido listo durante un máximo de 30 minutos desde su preparación. Transcurrido este tiempo, el pedido será descartado y no habrá lugar a reposición ni reembolso, dado que la calidad de los productos perecederos se deteriora con el tiempo. El Cliente acepta esta condición al seleccionar la modalidad Pick Up.</p>

        <h2>8. Cupones, Descuentos y Promociones</h2>
        <p>De tiempo en tiempo, El Carnal podrá ofrecer cupones, descuentos y promociones especiales. Estas campañas estarán sujetas a:</p>
        <ul>
          <li>Períodos de validez y condiciones específicas de redención.</li>
          <li>Posibles restricciones de no acumulabilidad con otras promociones.</li>
          <li>Disponibilidad exclusiva en los canales digitales de la Compañía.</li>
          <li>Imposibilidad de ser canjeados por dinero en efectivo.</li>
        </ul>
        <p>Las condiciones adicionales de cada promoción serán informadas oportunamente a través de los canales oficiales de El Carnal.</p>

        <h2>9. Habeas Data – Tratamiento de Datos Personales</h2>
        <p>En cumplimiento de la Ley 1581 de 2012 y sus decretos reglamentarios, Inversiones El Carnal SAS informa que los datos personales suministrados por el Cliente a través de sus canales serán recopilados, almacenados y utilizados para los siguientes fines:</p>
        <ul>
          <li>Gestión y procesamiento de pedidos.</li>
          <li>Comunicaciones comerciales, ofertas y promociones propias de la Compañía.</li>
          <li>Mejoramiento de la experiencia del usuario y análisis estadístico interno.</li>
          <li>Cumplimiento de obligaciones legales y tributarias.</li>
        </ul>
        <p>Inversiones El Carnal SAS garantiza que los datos personales no serán cedidos ni comercializados con terceros sin el consentimiento previo del titular, salvo las excepciones de ley.</p>
        <p>El titular de la información tiene los siguientes derechos:</p>
        <ul>
          <li>Conocer, actualizar, rectificar y suprimir sus datos personales.</li>
          <li>Solicitar información sobre el uso que se ha dado a sus datos.</li>
          <li>Revocar la autorización de tratamiento cuando lo estime pertinente.</li>
          <li>Acceder gratuitamente a sus datos personales objeto de tratamiento.</li>
        </ul>
        <p>Para ejercer cualquiera de estos derechos, el titular deberá dirigir su solicitud al correo electrónico info@elcarnal.com.co, indicando su nombre completo, número de identificación y la solicitud específica. La Compañía dará trámite a la petición en los términos establecidos por la ley.</p>

        <h2>10. Política de Privacidad</h2>
        <p>Al suministrar sus datos personales en los canales de El Carnal, el Cliente autoriza expresamente a Inversiones El Carnal SAS para realizar el tratamiento de dicha información en los términos descritos en la Sección 9 y de conformidad con el artículo 15 de la Constitución Política de Colombia, la Ley Estatutaria 1581 de 2012, el Decreto 1377 de 2013 y demás normas aplicables.</p>
        <p>Inversiones El Carnal SAS garantiza la seguridad, confidencialidad y uso adecuado de la información personal suministrada, aplicando medidas técnicas y administrativas para su protección. El Cliente se compromete a mantener actualizada su información y exime a la Compañía de cualquier responsabilidad derivada de datos desactualizados o incorrectos.</p>
        <p>Para consultas relacionadas con la Política de Privacidad, el Cliente puede comunicarse con Inversiones El Carnal SAS a través de:</p>
        <ul>
          <li>Correo electrónico: info@elcarnal.com.co</li>
          <li>Teléfono: 601 670 2872</li>
          <li>Dirección: CL 161 A 16 A 28, Bogotá D.C., Colombia</li>
        </ul>

        <p className="pt-6 text-center text-xs text-muted-foreground">© 2026 Inversiones El Carnal SAS · NIT 830.115.239-9 · Bogotá D.C., Colombia</p>
      </div>

      <div className="mt-10 text-center">
        <Link to="/" className="text-sm font-medium text-primary hover:underline">← Volver al inicio</Link>
      </div>
    </article>
  </PremiumBackground>
);

export default TerminosPage;
