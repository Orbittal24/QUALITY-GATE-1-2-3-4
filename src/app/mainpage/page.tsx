'use client';

import { useRouter } from 'next/navigation';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Button, Container, Row, Col } from 'reactstrap';

const ChatCard = () => {
  const router = useRouter();

  return (
    <Container className="text-center mt-5">
      <Row>
        <Col>
          <Button color="primary" onClick={() => router.push('/tables')}>
            Pack Checklist
          </Button>
        </Col>
        <Col>
          <Button color="secondary" onClick={() => router.push('/modulechecklist')}>
            Module Checklist
          </Button>
        </Col>
      </Row>
    </Container>
  );
};

export default ChatCard;
