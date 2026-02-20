import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Image {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  filename: string;

  @Column()
  mimetype: string;

  @Column({ type: 'bytea' }) // Para Postgres
  data: Buffer;

  @Column()
  nombre: string;

  @Column({ nullable: true })
  descripcion: string;
}