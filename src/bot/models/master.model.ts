import { Column, DataType, Model, Table } from 'sequelize-typescript';

interface IMasterCreationAttr {
  user_id: number;
  username: string;
  last_state: string
  profession: string
}

@Table({ tableName: 'masters' })
export class Master extends Model<Master, IMasterCreationAttr> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @Column({
    type: DataType.BIGINT,
  })
  declare user_id: number;

  @Column({
    type: DataType.STRING,
  })
  declare username: string;

  @Column({
    type: DataType.STRING,
  })
  declare profession: string;

  @Column({
    type: DataType.STRING,
  })
  declare name: string;

  @Column({
    type: DataType.STRING,
  })
  declare phone_number: string;

  @Column({
    type: DataType.STRING,
  })
  declare workshop_name: string;

  @Column({
    type: DataType.STRING,
  })
  declare address: string;

  @Column({
    type: DataType.STRING,
  })
  declare destination: string;

  @Column({
    type: DataType.STRING,
  })
  declare location: string;

  @Column({
    type: DataType.TIME,
  })
  declare start_time: string;

  @Column({
    type: DataType.TIME,
  })
  declare end_time: string;

  @Column({
    type: DataType.STRING,
  })
  declare time_by_customer: string;

  @Column({
    type: DataType.STRING,
  })
  declare last_state: string;
}
