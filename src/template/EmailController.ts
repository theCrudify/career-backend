import nodemailer from 'nodemailer';
import { db } from "../utils/db";


interface EmailData {
  subject: string;
  to: string;
  text: string;
  body: string;
}

async function sendEmailNotification(data: EmailData): Promise<boolean> {
  try {

    const transport = nodemailer.createTransport({
      host: 'mail.aio.co.id',
      port: 587,
      secure: false,
      auth: {
        user: 'appsskb@aio.co.id',
        pass: 'Plicaskb1234',
      },
      tls: { rejectUnauthorized: false },
      debug: true,
    });

    const message = {
      subject: data.subject,
      from: '"RISE" <appsskb@aio.co.id>',
      to: data.to,
      text: data.text,
      html: data.body,
    };

 
    const emailLog = await db.tr_email_log.create({
      data: {
        subject: message.subject,
        from: message.from,
        to: message.to,
        text: message.text,
        html: message.html,
        status: 'pending',
        created_at: new Date(),
      },
    });


    await transport.sendMail(message);


    await db.tr_email_log.update({
      where: { id: emailLog.id },
      data: { status: 'success' },
    });

    return true;
  } catch (error) {
    console.error('Error sending email:', error);

    // Optionally handle the failed email log creation here
    // await db.tr_email_log.create({
    //   data: {
    //     subject: message.subject,
    //     from: message.from,
    //     to: message.to,
    //     text: message.text,
    //     html: message.html,
    //     status: 'failed',
    //     created_at: new Date(),
    //   },
    // });

    return false;
  }
}

export { sendEmailNotification };
