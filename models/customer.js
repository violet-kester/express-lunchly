"use strict";

/** Customer for Lunchly */

const db = require("../db");
const Reservation = require("./reservation");

/** Customer of the restaurant. */

class Customer {
  constructor({ id, firstName, lastName, phone, notes }) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.fullName = this.getFullName();
    this.phone = phone;
    this.notes = notes;
  }

  /** find all customers. */

  static async all() {
    const results = await db.query(
      `SELECT id,
                  first_name AS "firstName",
                  last_name  AS "lastName",
                  phone,
                  notes
           FROM customers
           ORDER BY last_name, first_name`,
    );
    return results.rows.map(c => new Customer(c));
  }

  /** get a customer by ID. */

  static async get(id) {
    const results = await db.query(
      `SELECT id,
                  first_name AS "firstName",
                  last_name  AS "lastName",
                  phone,
                  notes
           FROM customers
           WHERE id = $1`,
      [id],
    );

    const customer = results.rows[0];

    if (customer === undefined) {
      const err = new Error(`No such customer: ${id}`);
      err.status = 404;
      throw err;
    }

    return new Customer(customer);
  }

  /** get a customer by name */

  static async getByName(searchName) {
    // const firstNameOnly = searchName + "%";
    // const lastNameOnly = "%" + searchName;
    // const fullName = searchName.split(' ');
    // const firstName = fullName[0] + "%";
    // const lastName = "%" + fullName[1];
    // console.log("firstName=", firstName, "lastName=", lastName);


    // console.log("firstName=", firstName);

    //TODO: rewrite it using ILIKE
    const results = await db.query(
      `SELECT id,
              first_name AS "firstName",
              last_name  AS "lastName",
              phone,
              notes
      FROM customers
      WHERE CONCAT(first_name, ' ' , last_name) ILIKE $1`,
      [`%${searchName}%`]
    );


    const customers = results.rows;

    if (!customers.length) {
      const err = new Error(`No such customer: ${searchName}`);
      err.status = 404;
      throw err;
    }
    //TODO: dont throw error when search doesnt find an input

    return customers.map(c => new Customer(c));
  }

  /** get all reservations for this customer. */

  async getReservations() {
    return await Reservation.getReservationsForCustomer(this.id);
  }

  /** save this customer. */

  async save() {
    if (this.id === undefined) {
      const result = await db.query(
        `INSERT INTO customers (first_name, last_name, phone, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
        [this.firstName, this.lastName, this.phone, this.notes],
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
        `UPDATE customers
             SET first_name=$1,
                 last_name=$2,
                 phone=$3,
                 notes=$4
             WHERE id = $5`, [
        this.firstName,
        this.lastName,
        this.phone,
        this.notes,
        this.id,
      ],
      );
    }
  }

  /** return full name */
  getFullName() {
    return this.firstName + ' ' + this.lastName;
  }

  /** Get best customers */
  static async getBestCustomers() {
    const results = await db.query(
      `SELECT
          c.id,
          first_name AS "firstName",
          last_name AS "lastName",
          phone,
          c.notes
        FROM customers AS c
          JOIN reservations AS r on r.customer_id = c.id
          GROUP BY c.id
          ORDER BY COUNT(c.id) DESC
          LIMIT 10
      `
    );
    const customers = results.rows;
    console.log("customers=", customers);

    if (!customers.length) {
      return customers;
    }
    //TODO: send to top ten template
    return customers.map(c => new Customer(c));
  }
}

module.exports = Customer;
