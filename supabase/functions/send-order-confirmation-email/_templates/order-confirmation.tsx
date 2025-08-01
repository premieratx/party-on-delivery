import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Section,
  Row,
  Column,
  Button,
  Hr,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface OrderItem {
  title: string;
  quantity: number;
  price: number;
}

interface OrderConfirmationEmailProps {
  customerName: string;
  orderNumber: string;
  orderItems: OrderItem[];
  totalAmount: number;
  deliveryDate: string;
  deliveryTime: string;
  deliveryAddress: any;
  shareUrl: string;
  groupOrderName: string;
}

export const OrderConfirmationEmail = ({
  customerName,
  orderNumber,
  orderItems,
  totalAmount,
  deliveryDate,
  deliveryTime,
  deliveryAddress,
  shareUrl,
  groupOrderName,
}: OrderConfirmationEmailProps) => (
  <Html>
    <Head />
    <Preview>Your Party On Delivery order #{orderNumber} is confirmed!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>🎉 Order Confirmed!</Heading>
        
        <Text style={text}>
          Hi {customerName},
        </Text>
        
        <Text style={text}>
          Thank you for your order! We're excited to deliver your items.
        </Text>

        <Section style={orderBox}>
          <Text style={orderTitle}>Order #{orderNumber}</Text>
          <Text style={orderSubtitle}>{groupOrderName}</Text>
        </Section>

        <Section style={section}>
          <Heading style={h2}>📦 Your Items</Heading>
          {orderItems.map((item, index) => (
            <Row key={index} style={itemRow}>
              <Column style={itemColumn}>
                <Text style={itemText}>{item.quantity}x {item.title}</Text>
              </Column>
              <Column style={priceColumn}>
                <Text style={itemPrice}>${(item.price * item.quantity).toFixed(2)}</Text>
              </Column>
            </Row>
          ))}
          <Hr style={hr} />
          <Row style={totalRow}>
            <Column style={itemColumn}>
              <Text style={totalText}>Total</Text>
            </Column>
            <Column style={priceColumn}>
              <Text style={totalPrice}>${totalAmount.toFixed(2)}</Text>
            </Column>
          </Row>
        </Section>

        <Section style={section}>
          <Heading style={h2}>🚚 Delivery Details</Heading>
          <Text style={text}>
            <strong>Date & Time:</strong> {new Date(deliveryDate).toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })} at {deliveryTime}
          </Text>
          <Text style={text}>
            <strong>Address:</strong><br />
            {deliveryAddress.street}<br />
            {deliveryAddress.city}, {deliveryAddress.state} {deliveryAddress.zipCode}
          </Text>
        </Section>

        <Section style={section}>
          <Heading style={h2}>👥 Share Your Group Order</Heading>
          <Text style={text}>
            Want to split delivery costs? Share your group order with friends and family!
          </Text>
          <Button style={button} href={shareUrl}>
            Share Group Order
          </Button>
          <Text style={smallText}>
            Anyone who joins gets FREE DELIVERY!
          </Text>
        </Section>

        <Section style={section}>
          <Text style={text}>
            Questions? Reply to this email or contact us at support@partyondelivery.com
          </Text>
        </Section>

        <Text style={footer}>
          <Link href="https://partyondelivery.com" style={link}>
            Party On Delivery
          </Link>
          <br />
          Your party supply delivery specialists
        </Text>
      </Container>
    </Body>
  </Html>
)

export default OrderConfirmationEmail

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
}

const box = {
  padding: '0 48px',
}

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
  textAlign: 'center' as const,
}

const h2 = {
  color: '#333',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '24px 0 12px',
}

const text = {
  color: '#333',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '16px 0',
}

const orderBox = {
  backgroundColor: '#f8f9fa',
  border: '1px solid #e9ecef',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 0',
  textAlign: 'center' as const,
}

const orderTitle = {
  color: '#333',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '0 0 8px',
}

const orderSubtitle = {
  color: '#666',
  fontSize: '14px',
  margin: '0',
}

const section = {
  padding: '0 48px',
}

const itemRow = {
  borderBottom: '1px solid #f1f3f4',
  padding: '8px 0',
}

const itemColumn = {
  verticalAlign: 'top' as const,
}

const priceColumn = {
  textAlign: 'right' as const,
  verticalAlign: 'top' as const,
}

const itemText = {
  color: '#333',
  fontSize: '14px',
  margin: '0',
}

const itemPrice = {
  color: '#333',
  fontSize: '14px',
  margin: '0',
}

const hr = {
  border: 'none',
  borderTop: '1px solid #e9ecef',
  margin: '16px 0',
}

const totalRow = {
  padding: '8px 0',
}

const totalText = {
  color: '#333',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0',
}

const totalPrice = {
  color: '#333',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0',
}

const button = {
  backgroundColor: '#007ee6',
  borderRadius: '4px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  width: '100%',
  padding: '12px',
  margin: '16px 0',
}

const smallText = {
  color: '#666',
  fontSize: '12px',
  lineHeight: '16px',
  margin: '8px 0',
  textAlign: 'center' as const,
}

const link = {
  color: '#007ee6',
  textDecoration: 'underline',
}

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  marginTop: '32px',
  textAlign: 'center' as const,
}